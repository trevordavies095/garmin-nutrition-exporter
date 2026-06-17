# Garmin Nutrition Exporter

A browser bookmarklet that reads your daily nutrition log from [Garmin Connect](https://connect.garmin.com/app/nutrition/) and exports it to share with a coach, trainer, or nutritionist.

No server, no Garmin API keys, and no account linking — it runs entirely in your browser on the page you already have open.

## Features

- Daily macro totals (calories, protein, carbs, fat) with goals
- Per-meal breakdown with consumed vs. goal
- Per-food detail: name, time logged, serving size, and macros
- Export as: Copy Summary, Copy Full Detail, Email to Coach, Download `.txt`
- Date-aware: reads the date from the URL so it works on past days too

## Quick start

### Install the bookmarklet

**Option A — hosted installer (easiest)**

Once this repo is published, open the installer page and drag the button to your bookmarks bar:

`https://<your-github-username>.github.io/garmin-nutrition-exporter/installer.html`

**Option B — local installer**

1. Clone this repo
2. Open `installer.html` in your browser (double-click works)
3. Show your bookmarks bar (`Cmd+Shift+B` on Mac, `Ctrl+Shift+B` on Windows)
4. Drag the blue **Export Garmin Nutrition** button onto the bar

### Use it

1. Go to [connect.garmin.com/app/nutrition/](https://connect.garmin.com/app/nutrition/)
2. Wait for the page to fully load
3. Click the bookmarklet
4. Copy, email, or download your log

## How it works

Garmin Connect blocks direct API calls from injected scripts (CORS + CSP). Instead, the bookmarklet reads data from the DOM that Garmin's React app has already rendered:

- **Daily totals** — read from `NutritionStatHBarChart_dataContainer` elements inside the first multibar chart container (e.g. `1,370 / 2,949`)
- **Meal stats** — parsed from `MealCard_mealStats` spans using the letter suffix (Cal / P / F / C) to identify each macro
- **Food items** — found globally via `MealCard_foodRowName`, then walked up the DOM tree to group them into their parent meal card containers
- **Serving / time / macros** — pulled from sibling elements within each food row

All class names use substring matching (`[class*="..."]`) so they survive Garmin's CSS hash changes across app versions — only the stable prefix before `__` is matched.

## Files

| File | Purpose |
|------|---------|
| `bookmarklet.js` | Readable source |
| `installer.html` | Drag-and-drop installer page (generated) |
| `build-installer.mjs` | Regenerates `installer.html` after editing `bookmarklet.js` |
| `LICENSE` | MIT license |

After changing `bookmarklet.js`, regenerate the installer:

```bash
node build-installer.mjs
```

## GitHub setup

**Recommended repo name:** [`garmin-nutrition-exporter`](https://github.com/new)

Clear, searchable, and describes exactly what the project does. Good alternatives if you want to be more specific:

| Name | Notes |
|------|-------|
| `garmin-nutrition-exporter` | **Recommended** — short and descriptive |
| `garmin-connect-nutrition-bookmarklet` | Emphasizes it's a bookmarklet, not an API integration |
| `garmin-nutrition-bookmarklet` | Shorter variant |

### Publish the repo

```bash
git init
git add .
git commit -m "Initial commit: Garmin Connect nutrition export bookmarklet"
gh repo create garmin-nutrition-exporter --public --source=. --push
```

### Enable GitHub Pages (optional, for a hosted installer)

1. Repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Your installer will be at `https://<username>.github.io/garmin-nutrition-exporter/installer.html`

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Overlay opens but data is empty | Make sure you're on `/app/nutrition/` and the page has finished loading |
| Bookmarklet stopped working after a Garmin update | Garmin may have renamed CSS modules — check class prefixes in `bookmarklet.js` |
| Installer button does nothing when clicked | Drag it to the bookmarks bar; don't click it on the installer page |

## Privacy

All parsing happens locally in your browser. Nothing is sent to any third-party server. The "Email to Coach" button opens your default mail client with the export in the message body.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Garmin Ltd. "Garmin" and "Garmin Connect" are trademarks of Garmin Ltd.

## License

MIT — see [LICENSE](LICENSE).
