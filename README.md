# 🏠 Nest — Household Bill Tracker

A simple, mobile-first React app that turns a pile of recurring bills into a single answer:
**"Is our biweekly direct deposit big enough to cover everything?"**

Built with React 18 + Vite + Tailwind + Recharts + Lucide. No backend — state lives entirely in the browser.

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)

---

## What it does

- **Dashboard** — Locked direct deposit → safety gauge (SAFE / WARNING / ACTION), upcoming high-expense alerts, total/monthly/biweekly summary cards, year-over-year comparison chart, and a per-bill line chart with prior-year overlay.
- **Bill List** — This-month view grouped into 🔴 Overdue, 🟡 Pending (variable bills you need to log), and 🟢 Auto-pay / fixed.
- **Manage Bills** — Add / edit / delete. Inline toggles for Auto-pay & Variable, tap a card to edit name / frequency / due date / amount.

### The math
- **Annual cost** = `amount × {Monthly: 12, Quarterly: 4, Yearly: 1}`
- **Required biweekly deposit** = `totalAnnual / 26`
- **Status** — `SAFE` if deposit covers required + 5% buffer, `WARNING` within 5%, `ACTION` if underfunded
- **Variable bills** fall back to their running monthly average when prior-year data is empty

All math is centralized in `src/data/calc.js` as pure functions. One source of truth — the dashboard total, biweekly amount, comparison chart, per-bill chart, and spike predictor can never disagree.

---

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in ./dist
npm run preview  # serves the built bundle locally
```

---

## 🐳 Deploy on a Synology NAS (Container Manager / Docker)

### Option A — One-shot from the NAS shell

```bash
ssh admin@<your-nas>
sudo -i
mkdir -p /volume1/docker && cd /volume1/docker
git clone <your-repo-url> bill-tracker
cd bill-tracker
docker compose up -d --build
```

Then browse to **`http://<nas-ip>:8123`**.

### Option B — Container Manager "Project" (DSM 7.2+)

1. Open **Container Manager → Project → Create**.
2. Choose **"Create docker-compose.yml"** or **"Upload"** and point it at this repo's `docker-compose.yml`.
3. Hit **Build** → **Start**.
4. Open `http://<nas-ip>:8123`.

### Changing the port
Edit the `ports:` line in `docker-compose.yml`:
```yaml
ports:
  - "8123:80"   # ← change 8123 to whatever's free on your NAS
```

### Updating after a `git pull`
```bash
cd /volume1/docker/bill-tracker
git pull
docker compose up -d --build
```

### Image details
- **Build stage:** `node:20-alpine` — compiles the React bundle.
- **Runtime stage:** `nginx:1.27-alpine` — serves the static `dist/` with gzip + SPA fallback + long-cache headers on `/assets/`.
- **Healthcheck** baked in so Docker / DSM marks the container unhealthy if nginx ever stops responding.

---

## Project layout

```
src/
├── App.jsx                  # state + sticky bottom nav + header
├── main.jsx, index.css      # entry + Tailwind
├── data/
│   ├── seed.js              # mock bills + per-bill last-year data
│   └── calc.js              # pure billing math (annualCost, expectedAmount, …)
└── components/
    ├── Dashboard.jsx        # tab 1: peace-of-mind, summary, charts
    ├── BillList.jsx         # tab 2: this-month action screen
    └── ManageBills.jsx      # tab 3: add/edit/delete + modal
```

---

## License

MIT — do whatever you want with it. 🐶
