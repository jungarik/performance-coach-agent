# Performance Coach Agent 🤖

A Telegram-based personal performance coach that runs daily check-ins (morning, midday, evening), logs to Google Sheets, and can generate brief AI feedback.

## Quick start

```bash
# 1) Clone + install
npm i

# 2) Copy env
cp .env.example .env
# Fill BOT_TOKEN, GOOGLE_SHEET_ID, and service account (path or JSON)

# 3) Run locally
npm run dev
```

### Commands
- `/start` – register and short intro
- `/morning` – morning planning
- `/midday` – quick check-in
- `/evening` – reflection
- `/help` – list commands

### Google Sheets
- Create a Sheet with a first tab named `Journal` with headers:
  `timestamp, date, chat_id, section, q1, q2, q3, mood, energy, notes`
- Share it with your service account email.

### Deploy on Railway
- New Project → Deploy from GitHub
- Add environment variables from `.env.example`
- Start command will be detected from `railway.json`

---

## Folder layout
```
bot/            # bot runtime
  handlers/     # message flows
  scheduler.js  # cron-based nudges (optional)
  index.js      # entrypoint
services/
  googleSheets.js
  aiCoach.js
utils/
  logger.js
```