# 🏠 Nest — Household Bill Tracker

A simple, mobile-first React app that turns a pile of recurring bills into a single answer:
**"Is our biweekly direct deposit big enough to cover everything?"**

Built with React 18 + Vite + Tailwind + Recharts + Lucide on the front, FastAPI + SQLite on the back.

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite&logoColor=white)
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

## Architecture

```
┌─────────────────────┐      /api/*      ┌──────────────────────────┐
│  React SPA (nginx)  │ ───────────────▶ │  FastAPI (uvicorn)       │
│  port 8123 → :80    │                  │  internal :8000          │
└─────────────────────┘                  │  SQLite at /data/bills.db│
                                         └──────────────────────────┘
                                                    │
                                                    ▼
                                         Docker named volume
                                         `bill_data` (persists)
```

- The browser only talks to **one origin**. nginx serves the SPA *and* reverse-proxies `/api/*` to the FastAPI service over Docker's internal network. The API container has **no host port** published.
- All bill data + the locked-deposit setting live in a **SQLite file** inside a named volume, so `docker compose down` (or rebuilding either image) never loses history.
- Pure functions in `src/data/calc.js` are unchanged — the backend just stores; the math still happens client-side.

---

## Local development

You can either run the API in Docker and the Vite dev server natively, or run the whole compose stack.

### Hybrid (fastest iteration on the UI)

```bash
# Terminal 1 — start the API in Docker
docker compose up -d --build bill-tracker-api
# (or: cd backend && uv venv && uv pip install -e . && uvicorn app.main:app --reload)

# Terminal 2 — Vite dev server, proxies /api/* to localhost:8000
npm install
npm run dev      # http://localhost:5173
```

`vite.config.js` proxies `/api` → `http://localhost:8000` by default. Override with `VITE_API_URL` if your API lives elsewhere.

### Full stack via compose

```bash
docker compose up -d --build
open http://localhost:8123
```

### Other commands

```bash
npm run build    # production bundle in ./dist
npm run preview  # serves the built bundle locally
```

---

## API surface

Same-origin, JSON in / JSON out.

| Method | Path                                                | Purpose                                  |
| ------ | --------------------------------------------------- | ---------------------------------------- |
| GET    | `/api/bills`                                        | List all bills (ordered by `sort_order`) |
| POST   | `/api/bills`                                        | Create a bill (server assigns id)        |
| PATCH  | `/api/bills/{id}`                                   | Partial update of any field              |
| DELETE | `/api/bills/{id}`                                   | Remove a bill                            |
| PUT    | `/api/bills/{id}/variable-amounts/{YYYY-MM}`        | Set the logged amount for a month        |
| POST   | `/api/bills/{id}/paid/{YYYY-MM}`                    | Toggle the paid flag for a month         |
| GET    | `/api/settings`                                     | Read `{ lockedDeposit }`                 |
| PUT    | `/api/settings`                                     | Update `{ lockedDeposit }`               |
| GET    | `/api/health`                                       | Liveness probe                           |

Interactive docs at `http://localhost:8000/docs` (or `http://<nas>:8123/api/docs` via the proxy).

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

### Backups

Your bills live in the `bill_data` Docker volume. To back up:

```bash
docker run --rm -v bill-tracker_bill_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/bills-$(date +%Y%m%d).tar.gz -C /data .
```

Restore by extracting the tar back into the volume the same way.

### Changing the port

Edit the `ports:` line for the `bill-tracker` service in `docker-compose.yml`:

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

---

## Project layout

```
.
├── docker-compose.yml         # frontend + backend + named volume
├── Dockerfile                 # frontend: node-build → nginx-serve
├── docker/nginx.conf          # SPA fallback + /api proxy → backend
├── vite.config.js             # dev-server /api proxy → localhost:8000
├── src/
│   ├── App.jsx                # loads from API on mount, mutates via API
│   ├── main.jsx, index.css    # entry + Tailwind
│   ├── data/
│   │   ├── api.js             # fetch client (one wrapper per endpoint)
│   │   ├── seed.js            # UI constant (FREQUENCIES) only
│   │   └── calc.js            # pure billing math
│   └── components/
│       ├── Dashboard.jsx
│       ├── BillList.jsx
│       └── ManageBills.jsx
└── backend/
    ├── Dockerfile             # python:3.12-slim + uvicorn
    ├── pyproject.toml
    └── app/
        ├── main.py            # FastAPI app + all routes
        ├── db.py              # sqlite3 helpers + row↔dict translation
        ├── schemas.py         # Pydantic v2 models
        └── seed.py            # one-time demo data on empty DB
```

---

## License

MIT — do whatever you want with it. 🐶
