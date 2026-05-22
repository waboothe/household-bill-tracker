// UI-facing constant only. The actual seed data + locked-deposit default
// now live in the backend (`backend/app/seed.py`) and are loaded over the
// API on first paint. Don't re-add the seed array here — it would just
// drift from the source of truth.

export const FREQUENCIES = ['Monthly', 'Quarterly', 'Yearly'];
