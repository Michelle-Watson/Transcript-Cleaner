# TranscriptClean

A single-page web app that cleans up meeting transcripts from `.vtt` or `.txt` files. Strips timestamps, removes formatting artifacts, replaces ellipses, and merges consecutive same-speaker lines into clean readable paragraphs.

---

## What it does

Given raw `.vtt` output from Zoom, Teams, or similar tools:

```
WEBVTT

1
00:00:03.220 --> 00:00:21.379
Michelle Watson: All right, so thank you.

2
00:00:21.380 --> 00:00:27.389
Michelle Watson: We started out as this extensive framework.
```

It produces clean, readable text:

```
Michelle Watson: All right, so thank you. We started out as this extensive framework.
```

Transforms applied (in order):

1. Normalize Windows line endings (`\r\n` → `\n`)
2. Remove `WEBVTT` header
3. Remove cue index lines (lone digits like `1`, `2`, `3`)
4. Remove timestamp lines (`00:00:03.220 --> 00:00:21.379`)
5. Remove stray `-->` arrows
6. Replace `…` (U+2026) and `...` with `,`
7. Strip blank lines
8. Merge consecutive lines from the same speaker into one paragraph, with a blank line between different speakers

---

## Project structure

```
/
├── artifacts/
│   ├── app/                        ← The web app (this is what gets deployed)
│   │   ├── public/
│   │   │   ├── favicon.svg         ← Browser tab icon (indigo document + wand)
│   │   │   └── opengraph.jpg       ← Social share preview image
│   │   ├── src/
│   │   │   ├── App.tsx             ← Entire UI: header, input, output, drag-drop
│   │   │   ├── index.css           ← Theme tokens (light + dark color palette)
│   │   │   ├── lib/
│   │   │   │   └── cleanTranscript.ts  ← All cleaning logic lives here
│   │   │   └── components/
│   │   │       ├── theme-provider.tsx  ← Dark mode context + localStorage sync
│   │   │       ├── ThemeToggle.tsx     ← Sun/moon click toggle in header
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

The app lives entirely in **`artifacts/app/`**. Everything else is scaffolding from the Replit monorepo template.

---

## Running locally

Requires [Node.js 20+](https://nodejs.org) and [pnpm](https://pnpm.io).

```bash
# Install from the repo root — required for workspace packages
pnpm install

# Start the dev server
pnpm --filter @workspace/app run dev
```

The terminal will print the local URL to open.

---

## Deploying to Vercel

When importing the GitHub repo into Vercel, use these settings:

| Field | Value |
|---|---|
| **Project Name** | Anything — e.g. `transcript-clean`. Sets the URL slug (`transcript-clean.vercel.app`). |
| **Root Directory** | Leave **blank** (repo root). Do not point it at a subdirectory — pnpm must install from the root to resolve workspace packages. |
| **Framework Preset** | **Other** |
| **Build Command** | `pnpm --filter @workspace/app run build` |
| **Output Directory** | `artifacts/app/dist/public` |
| **Install Command** | `pnpm install` |
| **Environment Variables** | None — all processing is client-side |

---

## Common customizations

### Change the browser tab icon (favicon)

Edit `artifacts/app/public/favicon.svg`. It is a plain SVG file — change the fill color, shapes, or swap it for a `.png` by updating the `<link rel="icon">` tag in `artifacts/app/index.html`:

```html
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

Replace `WandSparkles` with any [Lucide icon](https://lucide.dev/icons/) and update the import at the top of the file:

```tsx
import { FileCheck2 } from "lucide-react";
```

### Change the page title

Edit `artifacts/app/index.html`:

```html
<title>Transcript Cleaner</title>
```

### Change the color scheme

Edit `artifacts/app/src/index.css`. The `:root` block controls light mode, `.dark` controls dark mode. Values are space-separated HSL:

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

## Input controls

The toolbar below the input area has three buttons:

| Button | What it does |
|---|---|
| **Choose file** | Opens a file picker — accepts `.vtt` and `.txt` files |
| **Paste** | Reads text directly from the clipboard and fills the input in one click |
| **Clear** | Resets the entire form — clears the input, output, and any loaded filename. Only appears once there is content in the input, so it cannot be clicked by accident on an empty form |

---

## Dark mode behavior

- On first visit, the app matches the system preference (dark or light).
- Once the toggle is clicked, that choice is saved in the browser and persists across reloads, regardless of system settings.
- The toggle is a single click — no dropdown. 

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
