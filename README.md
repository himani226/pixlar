# Pixlar

> Free, private, and fast image & video processing tools everything runs in the browser. No uploads, no server storage, no account needed.

---

## Live Demo

Deploy your own → [Vercel](https://vercel.com) · [Netlify](https://netlify.com) · or your Hostinger VPS

---

## What it does

Pixlar is an all-in-one media toolkit built with Next.js 15. Every tool processes files **locally in the user's browser** using the Canvas API and FFmpeg.wasm — nothing is ever sent to a server.

### Image Tools

| Tool | Route | Description |
|---|---|---|
| Image Compressor | `/tools/compress-image` | Reduce JPG, PNG, WebP size by up to 90% with quality slider |
| Crop & Resize | `/tools/crop-resize` | Crop to ratio (1:1, 16:9, 4:3…) or resize to exact px |
| Text Overlay | `/tools/text-overlay` | Multi-line text, font, color, background box with opacity |
| Format Converter | `/tools/format-converter` | Convert between JPG, PNG, WebP, BMP instantly |

### Video Tools

| Tool | Route | Description |
|---|---|---|
| Video Compressor | `/tools/compress-video` | Compress MP4 with quality presets (high / balanced / small) |
| Trim Video | `/tools/trim-video` | Cut start and end with a timestamp slider |
| Merge Videos | `/tools/merge-video` | Combine multiple clips in any order into one file |
| Video Converter | `/tools/convert-video` | Convert to MP4, WebM, MKV, MOV, AVI, GIF |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS variables |
| Image processing | Canvas API + `browser-image-compression` |
| Video processing | FFmpeg.wasm (`@ffmpeg/ffmpeg`) |
| Hosting | Vercel / Hostinger VPS (Node.js + PM2 + Nginx) |
| SEO | Next.js Metadata API, JSON-LD schema, sitemap, robots.txt |

---

## Project Structure

```
pixlar
├── app/
│   ├── layout.tsx              # Root layout — Header, Footer, SEO metadata
│   ├── page.tsx                # Homepage — hero, tool grid, SEO content
│   ├── globals.css             # Design tokens, dark theme, component styles
│   ├── sitemap.ts              # Auto-generated sitemap.xml
│   ├── robots.ts               # robots.txt
│   ├── privacy/
│   │   └── page.tsx            # Privacy policy page
│   └── tools/
│       ├── compress-image/
│       │   ├── page.tsx        # SEO metadata (server component)
│       │   └── client.tsx      # Tool UI + logic (client component)
│       ├── crop-resize/
│       ├── text-overlay/
│       ├── format-converter/
│       ├── compress-video/
│       ├── trim-video/
│       ├── merge-video/
│       └── convert-video/
├── components/
│   ├── ToolLayout.tsx          # Shared wrapper — breadcrumb, title, privacy badge
│   ├── FileDropzone.tsx        # Drag-and-drop file upload component
│   └── DownloadButton.tsx      # Download button with file size savings display
├── lib/
│   └── useFFmpeg.ts            # Shared FFmpeg.wasm loader hook (singleton)
├── next.config.js              # Security headers, COOP/COEP for SharedArrayBuffer
├── tailwind.config.ts
└── DEPLOYMENT.md               # Full Hostinger VPS deployment guide
```

---

## Getting Started

### Prerequisites

- Node.js 20 LTS or later
- npm 10+

### Install and run locally

```bash
# Clone or unzip the project
cd pixlar

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for production

```bash
npm run build
npm start
```

---

## Deployment

### Option 1 — Vercel (easiest, free)

```bash
# Push to GitHub first
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pixlr-tools.git
git push -u origin main
```

Then go to [vercel.com](https://vercel.com) → Import project → Deploy.

No configuration needed. Vercel auto-detects Next.js.

### Option 2 — Hostinger VPS

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full guide including:
- Node.js setup
- PM2 process manager
- Nginx reverse proxy config
- Free SSL with Certbot

### Before going live — update your domain

Replace `yourdomain.com` in these three files:

```
app/layout.tsx     → line 4  → const SITE_URL = 'https://yourdomain.com'
app/sitemap.ts     → line 3  → const SITE_URL = 'https://yourdomain.com'
app/robots.ts      → line 3  → const SITE_URL = 'https://yourdomain.com'
```

---

## Customization Guide

### Add a new font (Text Overlay tool)

Open `app/tools/text-overlay/client.tsx` and add to the `FONTS` array:

```ts
const FONTS = [
  'Arial',
  'Georgia',
  'Roboto',       // ← add any font available in the browser
]
```

### Add a new preset (Text Overlay tool)

Add an object to the `PRESETS` array in `app/tools/text-overlay/client.tsx`:

```ts
{
  label: 'My custom preset',
  textColor: '#ffffff',
  bgColor:   '#1e3a5f',
  bgOpacity: 80,          // 0 = no background
  bold:      true,
  italic:    false,
  shadow:    false,
  fontSize:  40,
  font:      'Arial',
},
```

### Change compression quality defaults

Open `app/tools/compress-video/client.tsx` and edit `QUALITY_PRESETS`:

```ts
const QUALITY_PRESETS = [
  { label: 'High quality', crf: 23, desc: 'Best quality, ~40% smaller' },
  { label: 'Balanced',     crf: 28, desc: 'Good quality, ~60% smaller' },
  { label: 'Small file',   crf: 35, desc: 'Acceptable quality, ~80% smaller' },
]
// Lower CRF = better quality + bigger file
// Higher CRF = smaller file + lower quality
// Range: 18 (near lossless) → 40 (heavy compression)
```

### Change default image compression quality

Open `app/tools/compress-image/client.tsx`:

```ts
const [quality, setQuality] = useState(80)  // ← change default here (1–100)
```

### Add a new tool page

1. Create folder: `app/tools/your-tool/`
2. Add `page.tsx` (server component with metadata)
3. Add `client.tsx` (client component with `'use client'`)
4. Add it to the tool grid in `app/page.tsx` under `IMAGE_TOOLS` or `VIDEO_TOOLS`

---

## Security & Privacy

- **No server storage** — files are processed in-browser, never uploaded
- **Security headers** set in `next.config.js`:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Cross-Origin-Opener-Policy: same-origin` ← required for FFmpeg SharedArrayBuffer
  - `Cross-Origin-Embedder-Policy: require-corp`
- **No cookies**, no analytics by default
- **No third-party trackers**

---

## SEO Features

- Per-page `<title>`, `<meta description>`, Open Graph, Twitter Card tags
- JSON-LD structured data (`WebApplication` schema) on homepage
- Auto-generated `/sitemap.xml` and `/robots.txt`
- Canonical URLs on every page
- Static prerendering for all pages (fastest possible load)
- Semantic HTML with proper heading hierarchy

---

## Browser Support

All modern browsers. FFmpeg.wasm requires `SharedArrayBuffer` support which needs the COOP/COEP headers (already configured).

| Browser | Image tools | Video tools |
|---|---|---|
| Chrome 90+ | ✅ | ✅ |
| Firefox 89+ | ✅ | ✅ |
| Safari 15.2+ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ |

---

## Scripts

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build for production
npm start        # Start production server at port 3000
npm run lint     # Run ESLint
```

---

## License

MIT — free to use, modify, and deploy for personal or commercial projects.

---

## Acknowledgements

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) — FFmpeg compiled to WebAssembly
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) — client-side image compression
- [Next.js](https://nextjs.org) — React framework
- [Tailwind CSS](https://tailwindcss.com) — utility-first CSS
