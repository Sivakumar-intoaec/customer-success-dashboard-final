# IntoAEC CS Hub

Customer Success dashboard for paid **All-in-One** IntoAEC accounts. Built for CS managers and owners — not engineers.

## What you can do

- See portfolio health, engagement, and accounts that need focus
- Open any account for health history, adoption, power users, inactive users, onboarding, and alerts
- Draft check-in emails with the CS Copilot (optional Gemini key)
- Filter by health, trend, and country

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env` (defaults already point at production Autopilot + Paymaster)
3. Optional: set `GEMINI_API_KEY` for the AI copilot
4. `npm run dev` → open http://localhost:3000

## Environment

| Variable | Purpose |
|----------|---------|
| `AECAUTOPILOT_ENDPOINT` | Autopilot base URL (default production) |
| `AECAUTOPILOT_APIKEY` | Server-side `apikey` header for CS APIs |
| `PAYMASTER_ENDPOINT` | Paid org list |
| `GEMINI_API_KEY` | Optional AI drafts |

API keys stay on the server proxy — the browser never talks to Autopilot directly.
