# 10-Month Program

A personal training tracker for the 10-month lean-athletic program. Create an
account with your stats and it builds a calorie/protein/phase plan around you,
then tracks your daily mobility streak, bodyweight trend, and workouts.

No build step, no dependencies — plain HTML, CSS, and ES modules. Hosts free on
GitHub Pages.

## Run it

Because it uses JavaScript modules, browsers won't load it from a double-clicked
file (`file://`). Use one of these:

- **GitHub Pages** (how it's meant to run) — see below.
- **Locally**: from this folder run `python3 -m http.server` and open
  `http://localhost:8000`.

## Host on GitHub Pages

1. Create a new public repository on GitHub.
2. Upload every file here, keeping the folder structure intact.
3. Repo **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/(root)` → Save.
4. Wait ~1 minute, then open the URL it shows (e.g. `https://you.github.io/repo`).

## How the code is organised

    index.html            page shell; loads the CSS and js/main.js
    css/
      base.css            variables, layout, chrome, auth screen
      components.css      cards, buttons, chips, chart, history, etc.
    js/
      main.js             router: renders auth or the app shell + active tab
      state.js            app state; the only place saved data is mutated
      program.js          plan content + generateProgram() (the tailoring logic)
      accounts.js         account + per-user data storage
      chart.js            the hand-drawn SVG bodyweight chart
      lib/
        storage.js        localStorage wrapper with in-memory fallback
        crypto.js         SHA-256 password hashing
        dates.js          date helpers
        dom.js            small DOM + escaping helpers
      views/
        auth.js           log in + create account (runs the generator)
        today.js          mobility streak, supplements, quick weigh-in
        plan.js           the generated calorie/protein/phase plan
        progress.js       bodyweight stats + trend chart
        train.js          workout logging + history

## Important: what "accounts" means here

GitHub Pages serves static files only — there is no server or database. So
accounts and all data live **in the browser on one device**. They do not sync
across devices, and the password only gates the local screen; it is not real
security. For genuine cross-device accounts you'd add a backend such as Supabase.

Guardrails: profiles under 18 or already lean are held at maintenance rather than
pushed into a deficit, and there's a hard calorie floor.
