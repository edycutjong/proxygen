# Proxygen Dashboard

The military-grade SOC dashboard for the Proxygen Data Intelligence Agent.

## Environment Variables

Create a `.env.local` file in this directory based on `.env.example`:

```env
# ── Agent API ────────────────────────────────────────────────
# URL of the Proxygen agent API
# For local dev: http://localhost:3001
# For production: https://api.proxygen.edycu.dev
NEXT_PUBLIC_AGENT_API_URL=http://localhost:3001
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
