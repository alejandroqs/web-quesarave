import type { APIRoute } from 'astro';
// @ts-ignore
import { env } from 'cloudflare:workers';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function generateFingerprint(ip: string, userAgent: string): Promise<string> {
  const data = `${ip}:${userAgent}`;
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(status: number, body: object) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export const POST: APIRoute = async (context) => {
  try {
    // 1. Parse JSON body
    let body: any;
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse(400, { success: false, error: 'Invalid JSON body.' });
    }

    const { email, saturdayAfternoon, saturdayNight, sundayAfternoon } = body;

    // 2. Validate inputs
    if (!email || !EMAIL_REGEX.test(email)) {
      return jsonResponse(400, { success: false, error: 'A valid email is required.' });
    }

    const satAft = saturdayAfternoon ? 1 : 0;
    const satNight = saturdayNight ? 1 : 0;
    const sunAft = sundayAfternoon ? 1 : 0;

    // 3. Extract headers and generate fingerprint
    const ip = context.request.headers.get('cf-connecting-ip') || context.request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = context.request.headers.get('user-agent') || 'unknown';
    const fingerprint = await generateFingerprint(ip, userAgent);

    // 4. Resolve D1 database binding via native cloudflare:workers env
    const db = (env as any).DB;

    if (!db) {
      return jsonResponse(500, { success: false, error: 'Database binding "DB" not found.' });
    }

    // 5. Query DB (Batch query for email and fingerprint to optimize performance)
    const normalizedEmail = email.trim().toLowerCase();
    const batchResult = await db.batch([
      db.prepare('SELECT * FROM votes WHERE email = ?').bind(normalizedEmail),
      db.prepare('SELECT * FROM votes WHERE device_fingerprint = ?').bind(fingerprint),
    ]);

    const existingByEmail = batchResult[0].results?.[0] || null;
    const existingByFingerprint = batchResult[1].results?.[0] || null;

    // Scenario A: Multicount Fraud
    if (!existingByEmail && existingByFingerprint && existingByFingerprint.email !== normalizedEmail) {
      return jsonResponse(403, {
        success: false,
        error: 'A vote has already been registered from this device with a different email.',
      });
    }

    // Scenario B: Update existing vote
    if (existingByEmail) {
      await db.prepare(
        `UPDATE votes 
         SET saturday_afternoon = ?, 
             saturday_night = ?, 
             sunday_afternoon = ?, 
             device_fingerprint = ?, 
             updated_at = datetime('now')
         WHERE email = ?`
      )
      .bind(satAft, satNight, sunAft, fingerprint, normalizedEmail)
      .run();

      const updatedRow = await db.prepare('SELECT * FROM votes WHERE email = ?').bind(normalizedEmail).first();
      return jsonResponse(200, { success: true, updated: true, data: updatedRow });
    }

    // Scenario C: New vote
    await db.prepare(
      `INSERT INTO votes (email, saturday_afternoon, saturday_night, sunday_afternoon, device_fingerprint)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(normalizedEmail, satAft, satNight, sunAft, fingerprint)
    .run();

    const insertedRow = await db.prepare('SELECT * FROM votes WHERE email = ?').bind(normalizedEmail).first();
    return jsonResponse(200, { success: true, updated: false, data: insertedRow });

  } catch (error: any) {
    console.error('Error handling API route:', error);
    return jsonResponse(500, { success: false, error: error.message || 'Internal server error' });
  }
};