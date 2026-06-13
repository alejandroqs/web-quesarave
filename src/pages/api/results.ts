import type { APIRoute } from 'astro';

export const prerender = false;

function jsonResponse(status: number, body: object) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=5', // edge cache for 5 seconds to reduce DB load
    },
  });
}

export const GET: APIRoute = async (context) => {
  try {
    // Resolve D1 database binding
    let db: any;
    try {
      // @ts-ignore
      const workers = await import('cloudflare:workers');
      db = workers.env.DB;
    } catch (e) {
      console.error('Failed to import cloudflare:workers', e);
    }

    if (!db) {
      return jsonResponse(500, { success: false, error: 'Database binding "DB" not found.' });
    }

    // Execute query to get aggregates
    const query = `
      SELECT 
        COUNT(*) as total_responses,
        COALESCE(SUM(CASE WHEN saturday_afternoon = 1 OR saturday_night = 1 OR sunday_afternoon = 1 THEN 1 ELSE 0 END), 0) as total_attending,
        COALESCE(SUM(CASE WHEN saturday_afternoon = 0 AND saturday_night = 0 AND sunday_afternoon = 0 THEN 1 ELSE 0 END), 0) as total_not_attending,
        COALESCE(SUM(saturday_afternoon), 0) as count_sat_afternoon,
        COALESCE(SUM(saturday_night), 0) as count_sat_night,
        COALESCE(SUM(sunday_afternoon), 0) as count_sun_afternoon
      FROM votes;
    `;

    const stats = await db.prepare(query).first();

    if (!stats) {
      return jsonResponse(200, {
        success: true,
        data: {
          totalResponses: 0,
          totalAttending: 0,
          totalNotAttending: 0,
          sessions: {
            saturdayAfternoon: 0,
            saturdayNight: 0,
            sundayAfternoon: 0,
          },
        },
      });
    }

    return jsonResponse(200, {
      success: true,
      data: {
        totalResponses: stats.total_responses,
        totalAttending: stats.total_attending,
        totalNotAttending: stats.total_not_attending,
        sessions: {
          saturdayAfternoon: stats.count_sat_afternoon,
          saturdayNight: stats.count_sat_night,
          sundayAfternoon: stats.count_sun_afternoon,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching aggregate results:', error);
    return jsonResponse(500, { success: false, error: error.message || 'Internal server error' });
  }
};
