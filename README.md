# QuesaRave RSVP Manager

An ultra-lightweight, edge-native attendance and RSVP management web application designed for an exclusive nighttime electronic music party. 

Built with **Astro 6 (SSR)**, **Preact**, **Tailwind CSS v4**, **Cloudflare Workers**, and **Cloudflare D1**.

---

## 🚀 Key Features

* **Island Architecture:** Leverages Astro's partial hydration to ship zero client-side JavaScript by default, only hydrating the interactive RSVP form island.
* **Modern Aesthetic:** Deep dark theme (`#0B0C10`) styled with translucent glassmorphic panels, subtle borders, and neon glow accents (Cyan & Magenta).
* **Simplified Selection:** Users check the session checkboxes directly. No redundant radio buttons.
* **Edge Performance:** API routes run directly on Cloudflare Edge functions for instant global execution.
* **Real-time Results Dashboard:** A public, aggregate statistics page at `/results` that polls the D1 database in the background every 10 seconds. Updates are rendered dynamically without layout shift or page flashes.
* **Anti-Fraud Security:** Automatically fingerprint devices using Web Crypto SHA-256 hashes of the client IP and User-Agent. Blocks users attempting to submit multiple RSVPs under different email addresses from the same device.
* **Auto-Persistence:** Remembers user choices locally. If a vote is detected, it skips the form and displays a read-only RSVP summary. The user can choose to "Modify Response" to unlock the form.

---

## 🛠️ Tech Stack

* **Framework:** [Astro v6.0](https://astro.build/)
* **Client-Side Interactivity:** [Preact](https://preactjs.com/)
* **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com/) (Vite Plugin + CSS `@theme` tokens)
* **Hosting Platform:** [Cloudflare Pages](https://pages.cloudflare.com/) / [Workers](https://workers.cloudflare.com/)
* **Database:** [Cloudflare D1 SQLite](https://developers.cloudflare.com/d1/)

---

## 📦 Local Development Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies
Clone the repository and run:
```bash
npm install
```
*Note: A Vite override is set in `package.json` to lock dependency resolution to Vite v7. This prevents runtime conflicts with Astro 6.*

### 2. Initialize the Local SQLite Database
Seed the local SQLite emulation directory with the database schema:
```bash
npm run db:init
```

### 3. Run the Development Server
Launch the Astro edge dev server locally:
```bash
npm run dev
```
Open `http://localhost:4321` in your browser.

---

## 🔌 API Endpoint: `POST /api/vote`

Submit or modify an RSVP response.

### Request Body
```json
{
  "email": "user@example.com",
  "saturdayAfternoon": true,
  "saturdayNight": true,
  "sundayAfternoon": false
}
```

### Responses
* **`200 OK` (New Vote)**:
  ```json
  { "success": true, "updated": false, "data": { ... } }
  ```
* **`200 OK` (Updated Vote)**:
  ```json
  { "success": true, "updated": true, "data": { ... } }
  ```
* **`400 Bad Request`**: Validation errors (e.g. invalid email format).
* **`403 Forbidden`**: Anti-fraud trigger. A different email has already submitted from this device's fingerprint.
  ```json
  { "success": false, "error": "A vote has already been registered from this device with a different email." }
  ```

---

## 🔌 API Endpoint: `GET /api/results`

Retrieve aggregate statistics and headcount counts from the database.

### Response
* **`200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "totalResponses": 42,
      "totalAttending": 38,
      "totalNotAttending": 4,
      "sessions": {
        "saturdayAfternoon": 30,
        "saturdayNight": 35,
        "sundayAfternoon": 22
      }
    }
  }
  ```

---

## 🗄️ Database Schema

The database table `votes` is structured as follows in SQLite:

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Auto-incremented ID |
| `email` | `TEXT` | `UNIQUE INDEX` | User's unique email |
| `saturday_afternoon` | `INTEGER` | `DEFAULT 0` | 0 = false, 1 = true |
| `saturday_night` | `INTEGER` | `DEFAULT 0` | 0 = false, 1 = true |
| `sunday_afternoon` | `INTEGER` | `DEFAULT 0` | 0 = false, 1 = true |
| `device_fingerprint` | `TEXT` | `INDEXED` | SHA-256 IP + UserAgent |
| `created_at` | `TEXT` | `DEFAULT (datetime('now'))` | Record creation UTC timestamp |
| `updated_at` | `TEXT` | `DEFAULT (datetime('now'))` | Record update UTC timestamp |

---

## 🚀 Cloudflare Deployment

1. **Create the D1 database in production**:
   ```bash
   npx wrangler d1 create quesarave
   ```
2. **Apply migrations/schema to production**:
   ```bash
   npx wrangler d1 execute quesarave --remote --file=./schema.sql
   ```
3. **Configure the Database ID**:
   Update `wrangler.toml` by replacing the `database_id` value with the UUID outputted by step 1.
4. **Deploy the application**:
   Use Cloudflare Pages git integration or deploy via CLI:
   ```bash
   npm run build
   npx wrangler pages deploy dist/
   ```
