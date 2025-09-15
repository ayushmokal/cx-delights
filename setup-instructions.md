# Google Apps Script Web App Setup (Sheets + Slack)

Use this if you’re submitting from the Next.js form.

## 1) Create the Apps Script Web App
- Open https://script.google.com and create a new project.
- Paste the contents of `scripts/apps-script.gs` into the editor (replace any placeholder code).
- File → Project properties → Script properties → add `SLACK_WEBHOOK_URL` with your Slack Incoming Webhook URL.
- Save.

## 2) Link to the Sheet
- The script uses Spreadsheet ID already in the file and writes to sheet `Submissions` (or first sheet if missing).
- Ensure your Google account has access to that spreadsheet.

## 3) Deploy
- Deploy → Manage deployments → New deployment.
- Select "Web app".
- Execute as: Me.
- Who has access: Anyone with the link.
- Copy the Web app URL and set it in `.env.local` as `GOOGLE_APPS_SCRIPT_URL=...`.

## 4) Test quickly
From a terminal:

```bash
curl -i -X POST "$GOOGLE_APPS_SCRIPT_URL" \
  -H 'Content-Type: application/json' \
  -d '{"ticketLink":"https://example.com/ticket","productLink":"https://amazon.com/item","occasion":"Birthday","agentName":"Tester"}'
```

Expected: JSON `{ ok: true }`. Check the sheet and Slack for the new entry.

## Troubleshooting
- If you see an HTML error page from Apps Script, your deployment code likely has a missing helper; repaste `scripts/apps-script.gs` and redeploy.
- In Apps Script, View → Executions to see logs (e.g., Slack errors).
- Ensure `GOOGLE_APPS_SCRIPT_URL` is set; otherwise the UI may show success while nothing is written.
