# TranscriptClean

A single-page web app that cleans up meeting transcripts from `.vtt` or `.txt` files. Strips timestamps, removes formatting artifacts, replaces ellipses, and merges consecutive same-speaker lines into clean readable paragraphs.

**Live app:** https://transcript-clean.replit.app (or your Vercel URL once deployed)

---

## What it does

Given raw `.vtt` output from Zoom, Teams, or similar tools:

```
WEBVTT

1
00:00:03.220 --> 00:00:21.379
Ife Babatunde: All right, so thank you.

2
00:00:21.380 --> 00:00:27.389
Ife Babatunde: We started out as this extensive framework.
```

It produces clean, readable text:

```
Ife Babatunde: All right, so thank you. We started out as this extensive framework.
```

Transforms applied (in order):
1. Normalize Windows line endings (`\r\n` → `\n`)
2. Remove `WEBVTT` header
3. Remove cue index lines (lone digits like `1`, `2`, `3`)
4. Remove timestamp lines (`00:00:03.220 --> 00:00:21.379`)
5. Remove stray `-->` arrows
6. Replace `…` (U+2026) and `...` with `,`
7. Strip blank lines
8. Merge consecutive lines from the same speaker into one paragraph, separated from other speakers by a blank line

---

## Project structure

```
/
├── artifacts/
│   ├── app/                        ← The actual web app (deploy this)
│   │   ├── public/
│   │   │   ├── favicon.svg         ← Browser tab icon (indigo document+wand)
│   │   │   └── opengraph.jpg       ← Social share preview image
│   │   ├── src/
│   │   │   ├── App.tsx             ← Entire UI: header, input, output, drag-drop
│   │   │   ├── index.css           ← Theme tokens (light + dark color palette)
│   │   │   ├── lib/
│   │   │   │   └── cleanTranscript.ts  ← All cleaning logic lives here
│   │   │   └── components/
│   │   │       ├── theme-provider.tsx  ← Dark mode context + localStorage sync
│   │   │       ├── ThemeToggle.tsx     ← Sun/moon toggle button in header
│   │   │       └── ui/             ← shadcn/ui components (Button, Textarea, etc.)
│   │   ├── index.html              ← Page title + favicon reference
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── api-server/                 ← Express API server (not used by this app)
│   ├── mockup-sandbox/             ← Wireframe mockups (design reference only)
│   └── transcript-cleaner/         ← Early wireframe mockups (design reference only)
├── lib/
│   ├── api-client-react/           ← Auto-generated API hooks (not used here)
│   ├── api-spec/                   ← OpenAPI spec (not used here)
│   └── db/                         ← Database schema (not used here)
└── pnpm-workspace.yaml
```

The app you care about lives entirely in **`artifacts/app/`**. Everything else in the repo is scaffolding from the Replit monorepo template.

---

## Running locally

Requires [Node.js 20+](https://nodejs.org) and [pnpm](https://pnpm.io).

```bash
# Install dependencies (run from repo root — required for workspace packages)
pnpm install

# Start the dev server
pnpm --filter @workspace/app run dev
```

Open http://localhost:PORT (the port printed in the terminal).

---

## Deploying to Vercel

Vercel is importing from your GitHub repo. Here is exactly what to fill in:

| Field | Value |
|---|---|
| **Project Name** | Anything you like — e.g. `transcript-clean`. This becomes the URL slug (`transcript-clean.vercel.app`). |
| **Root Directory** | Leave **blank** (the repo root `/`). Do NOT set it to `artifacts/app` or `artifacts/api-server`. pnpm needs to install from the root to resolve workspace packages. |
| **Framework Preset** | **Other** (or Vite — either works, but you'll override the commands below) |
| **Build Command** | `pnpm --filter @workspace/app run build` |
| **Output Directory** | `artifacts/app/dist/public` |
| **Install Command** | `pnpm install` |
| **Environment Variables** | None needed — all processing is client-side |

> **Important:** The screenshot shows `artifacts/api-server` as the root directory and "Express" as the framework. Both are wrong — click **Edit** on Root Directory and clear it to `/` (blank).

---

## Common customizations

### Change the browser tab icon (favicon)

Edit `artifacts/app/public/favicon.svg`. It's a plain SVG file — change the fill color, shapes, or replace it entirely with a `.png` or `.ico` by updating the `<link rel="icon">` line in `artifacts/app/index.html`.

```html
<!-- artifacts/app/index.html -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<!-- or for a PNG: -->
<link rel="icon" type="image/png" href="/favicon.png" />
```

### Change the in-app header icon

In `artifacts/app/src/App.tsx`, find the header section:

```tsx
<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
  <WandSparkles className="w-4 h-4 text-primary-foreground" />
</div>
```

Replace `WandSparkles` with any [Lucide icon](https://lucide.dev/icons/) — just import it at the top of the file:

```tsx
import { FileCheck2 } from "lucide-react"; // example
```

### Change the page title

Edit `artifacts/app/index.html`:

```html
<title>Transcript Cleaner</title>
```

### Change the color scheme

Edit `artifacts/app/src/index.css`. The `:root` block controls light mode, `.dark` controls dark mode. All values are space-separated HSL:

```css
:root {
  --primary: 239 84% 60%;  /* indigo — change this for a different accent color */
  --background: 0 0% 98%;
  /* ... */
}
```

### Modify the cleaning logic

All transform steps are in `artifacts/app/src/lib/cleanTranscript.ts`. The function takes a raw string and returns the cleaned string. Add, remove, or reorder steps inside that file.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 7 |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |
| Dark mode | CSS class strategy + localStorage |
| Routing | Wouter |
| Package manager | pnpm (workspace monorepo) |
| All processing | 100% client-side — no server, no API calls |
