# CX Delights — External Delights Form

Simple Next.js (App Router) web form to collect "External Delights" requests from CX agents and append them into a Google Sheet via Google Apps Script. Includes client-side validation and a fun confetti animation on success.

## Fields

- Ticket Link (Email/Chat)
- Amazon Product Link (<= ₹3,000 / ~$35)
- Occasion (Birthday / Achievement / etc.)
- Your Name

## Sheet Columns (Header Row)

Place this header row in the first sheet (or let the Apps Script create it on first write):

1. `timestamp`
2. `agentName`
3. `occasion`
4. `ticketLink`
5. `productLink`

## Local Setup

1. Copy `.env.local.example` to `.env.local` and set `GOOGLE_APPS_SCRIPT_URL` after deploying the Apps Script as a web app.
2. Install deps and run:

   ```bash
   pnpm i # or npm i / yarn
   pnpm dev
   ```

App runs at `http://localhost:3000`.

## Google Apps Script (Web App)

Create an Apps Script project connected to your Google Sheet (ID below), paste the code from `scripts/apps-script.gs`, and deploy as a Web App with access "Anyone with the link". Then copy the web app URL into `GOOGLE_APPS_SCRIPT_URL`.

### Spreadsheet

ID: `1UXdv8Jya0EiYYeDNJAJTPErlOh_wv2L8LFwqEQ7RrL8`

Sheet name: recommended `Submissions` (the script falls back to the first sheet if `Submissions` does not exist).

## Notes

- The API route `app/api/submit/route.ts` validates input and forwards to Apps Script. If the env var is missing, it returns `202 Accepted` with a warning to avoid blocking the UX.
- Confetti is implemented via a lightweight canvas animation (`#confetti-canvas`).

