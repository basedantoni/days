# Days Redux - Year Progress Wallpaper Generator

## Implementation Plan

## Overview

A Next.js application with a single API endpoint (`/days`) that dynamically generates a PNG image showing a year-progress dot grid. The image is designed to be used as a phone wallpaper, updated daily via iOS Shortcuts.

## Design Reference

Based on the screenshot at `/Users/anthony/Downloads/days.png`:
- Dark charcoal background (~`#333333`)
- Grid of ~19 columns x 20 rows of small circular dots
- Past days: muted gray (`#888888`)
- Current day: bright orange/red (`#FF6B35`)
- Future days: dark gray (`#555555`)
- Bottom text: "days XX/365" in muted gray, small font
- Grid is vertically centered with generous padding, shifted slightly above center
- Clean, minimal aesthetic

---

## Phase 1: Project Scaffolding

### 1.1 Initialize Next.js Project

Run from `/Users/anthony/dev/days-redux`:

```bash
npx create-next-app@latest . --typescript --app --no-tailwind --no-eslint --no-src-dir --no-import-alias --use-npm
```

Flags rationale:
- `--typescript`: TypeScript required
- `--app`: App Router
- `--no-tailwind`: No Tailwind needed (image generation uses inline styles)
- `--no-eslint`: Keep it minimal
- `--no-src-dir`: Flat `app/` directory at root
- `--no-import-alias`: No path aliases needed
- `--use-npm`: Use npm as package manager

### 1.2 Clean Up Scaffolding

Remove unnecessary files that `create-next-app` generates:
- `app/page.tsx` - replace with a simple redirect or info page
- `app/globals.css` - not needed
- `app/layout.tsx` - simplify to bare minimum
- `public/` assets - remove default Next.js SVGs

### 1.3 Final Project Structure

```
days-redux/
  app/
    layout.tsx          # Minimal root layout
    page.tsx            # Simple landing page (optional, can redirect to /days)
    days/
      route.tsx         # Main API endpoint - generates the PNG
  lib/
    date-utils.ts       # Day-of-year calculation, leap year check
    grid.ts             # Grid layout calculation (columns, rows, dot positions)
    defaults.ts         # Default colors, dimensions, grid config
  package.json
  tsconfig.json
  next.config.ts
```

### Success Criteria

#### Automated Verification:
- [x] `npm run build` completes without errors
- [x] `npm run dev` starts the dev server
- [x] Project structure matches the plan

---

## Phase 2: Core Utilities

### 2.1 Date Utilities (`lib/date-utils.ts`)

```typescript
/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get total days in a given year (365 or 366).
 */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Get the current day of the year (1-indexed).
 * Jan 1 = 1, Dec 31 = 365 or 366.
 */
export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
```

### 2.2 Grid Layout Calculator (`lib/grid.ts`)

The grid needs to lay out 365 (or 366) dots in a visually balanced grid.

**Strategy**: Use 19 columns. This gives:
- 365 days / 19 columns = 19 full rows + 4 remaining = 20 rows (last row has 4 dots)
- 366 days / 19 columns = 19 full rows + 5 remaining = 20 rows (last row has 5 dots)

This matches the ~19x20 layout visible in the screenshot.

```typescript
export interface GridConfig {
  columns: number;
  rows: number;
  totalDots: number;
  dotRadius: number;
  dotSpacing: number;  // center-to-center distance
  gridWidth: number;   // total pixel width of the grid
  gridHeight: number;  // total pixel height of the grid
  offsetX: number;     // left offset to center grid in image
  offsetY: number;     // top offset to center grid in image (shifted up slightly)
}

export function calculateGrid(
  imageWidth: number,
  imageHeight: number,
  totalDays: number
): GridConfig {
  const columns = 19;
  const rows = Math.ceil(totalDays / columns);

  // Calculate dot size based on image dimensions
  // The grid should occupy roughly 75% of the width and 55% of the height
  const availableWidth = imageWidth * 0.75;
  const availableHeight = imageHeight * 0.55;

  // Spacing is constrained by whichever dimension is tighter
  const spacingByWidth = availableWidth / columns;
  const spacingByHeight = availableHeight / rows;
  const dotSpacing = Math.floor(Math.min(spacingByWidth, spacingByHeight));

  // Dot radius is ~35% of spacing (so dots have clear gaps between them)
  const dotRadius = Math.floor(dotSpacing * 0.35);

  const gridWidth = (columns - 1) * dotSpacing;
  const gridHeight = (rows - 1) * dotSpacing;

  // Center horizontally, shift slightly above vertical center
  const offsetX = Math.floor((imageWidth - gridWidth) / 2);
  const offsetY = Math.floor((imageHeight - gridHeight) / 2) - Math.floor(imageHeight * 0.06);

  return {
    columns,
    rows,
    totalDots: totalDays,
    dotRadius,
    dotSpacing,
    gridWidth,
    gridHeight,
    offsetX,
    offsetY,
  };
}
```

### 2.3 Defaults (`lib/defaults.ts`)

```typescript
export const DEFAULTS = {
  width: 1170,
  height: 2532,
  bgColor: '333333',
  primary: '888888',   // past days
  secondary: '555555', // future days
  accent: 'FF6B35',    // current day
} as const;
```

### Success Criteria

#### Automated Verification:
- [x] `npm run build` compiles with no type errors
- [x] Date utility functions return correct values (verified by manual spot check or simple test)

---

## Phase 3: API Route - Image Generation

### 3.1 Route Handler (`app/days/route.tsx`)

This is the core of the application. It uses `ImageResponse` from `next/og` to render the dot grid as a PNG.

**Important Satori/ImageResponse constraints:**
- Only `display: flex` is supported (no CSS Grid)
- `border-radius: 50%` works for circles
- All elements need explicit `display: flex` (default is flex in Satori)
- Flexbox `gap` is supported
- Percentage units and px units work
- `flexWrap: 'wrap'` works for flowing items into rows

**Approach**: Use `flexWrap: 'wrap'` on a container with a fixed width equal to `columns * dotSpacing`. Each dot is a fixed-size div with `borderRadius: '50%'`. This naturally wraps into the correct number of rows without needing CSS Grid.

```tsx
import { ImageResponse } from 'next/og';
import { dayOfYear, daysInYear } from '../../lib/date-utils';
import { calculateGrid } from '../../lib/grid';
import { DEFAULTS } from '../../lib/defaults';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse query params with defaults
  const width = parseInt(searchParams.get('width') || String(DEFAULTS.width), 10);
  const height = parseInt(searchParams.get('height') || String(DEFAULTS.height), 10);
  const bgColor = '#' + (searchParams.get('bgColor') || DEFAULTS.bgColor);
  const primary = '#' + (searchParams.get('primary') || DEFAULTS.primary);
  const secondary = '#' + (searchParams.get('secondary') || DEFAULTS.secondary);
  const accent = '#' + (searchParams.get('accent') || DEFAULTS.accent);

  const now = new Date();
  const currentDay = dayOfYear(now);
  const totalDays = daysInYear(now.getFullYear());
  const grid = calculateGrid(width, height, totalDays);

  // Build array of dots
  const dots = [];
  for (let i = 0; i < totalDays; i++) {
    const dayNum = i + 1; // 1-indexed
    let color: string;
    if (dayNum < currentDay) {
      color = primary;
    } else if (dayNum === currentDay) {
      color = accent;
    } else {
      color = secondary;
    }

    dots.push(
      <div
        key={i}
        style={{
          width: grid.dotRadius * 2,
          height: grid.dotRadius * 2,
          borderRadius: '50%',
          backgroundColor: color,
          // Use margin to create spacing between dots
          // Each dot cell is dotSpacing wide, dot itself is dotRadius*2
          // So margin on each side = (dotSpacing - dotRadius*2) / 2
          margin: (grid.dotSpacing - grid.dotRadius * 2) / 2,
        }}
      />
    );
  }

  // Label text
  const label = `days ${currentDay}/${totalDays}`;
  const fontSize = Math.floor(width * 0.03); // ~3% of width

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid container */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: grid.columns * grid.dotSpacing,
            marginTop: -Math.floor(height * 0.06), // shift grid slightly above center
          }}
        >
          {dots}
        </div>

        {/* Bottom label */}
        <div
          style={{
            display: 'flex',
            marginTop: Math.floor(height * 0.04),
            color: primary,
            fontSize: fontSize,
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
```

### 3.2 Key Design Decisions

1. **`flexWrap: 'wrap'`** instead of CSS Grid - Satori does not support CSS Grid. By setting the container width to exactly `columns * dotSpacing`, the dots naturally wrap at 19 per row.

2. **Dot sizing via margin** - Each dot has margin calculated so that center-to-center distance equals `dotSpacing`. This keeps the grid uniform.

3. **Edge runtime** - Faster cold starts for image generation. No filesystem access needed.

4. **No caching headers** - The image changes daily, and iOS Shortcuts will fetch it once per day. We could add `Cache-Control: public, max-age=3600` (1 hour) if needed, but it's not critical.

### 3.3 Minimal Landing Page (`app/page.tsx`)

A simple page that shows usage instructions and a preview link:

```tsx
export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto' }}>
      <h1>Days</h1>
      <p>Year progress wallpaper generator.</p>
      <h2>Usage</h2>
      <p>
        <code>GET /days</code> — returns a PNG image
      </p>
      <h3>Query Parameters</h3>
      <ul>
        <li><code>width</code> — image width in px (default: 1170)</li>
        <li><code>height</code> — image height in px (default: 2532)</li>
        <li><code>bgColor</code> — background hex without # (default: 333333)</li>
        <li><code>primary</code> — past days color (default: 888888)</li>
        <li><code>secondary</code> — future days color (default: 555555)</li>
        <li><code>accent</code> — current day color (default: FF6B35)</li>
      </ul>
      <p>
        <a href="/days">View default wallpaper</a>
      </p>
    </main>
  );
}
```

### 3.4 Simplified Layout (`app/layout.tsx`)

```tsx
export const metadata = {
  title: 'Days',
  description: 'Year progress wallpaper generator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Success Criteria

#### Automated Verification:
- [x] `npm run build` succeeds with no errors
- [x] `npm run dev` starts and `curl -o test.png http://localhost:3000/days` downloads a valid PNG
- [x] `curl -o test2.png "http://localhost:3000/days?width=800&height=600&accent=FF0000"` works with custom params

#### Manual Verification:
- [ ] Open `http://localhost:3000/days` in browser - should display a PNG matching the design screenshot
- [ ] The current day dot is orange/red and positioned correctly for today's date (day 38 of 2026)
- [ ] Past days are lighter gray, future days are darker gray
- [ ] Bottom text reads "days 38/365" (or whatever today's day number is)
- [ ] Grid is centered and visually balanced
- [ ] Custom query parameters change colors and dimensions correctly
- [ ] The image looks good at phone wallpaper resolution (1170x2532)

---

## Phase 4: Polish and Edge Cases

### 4.1 Input Validation

Add bounds checking in the route handler:
- Clamp `width` to 100-4000 range
- Clamp `height` to 100-8000 range
- Validate hex color strings (6 chars, valid hex digits), fall back to defaults on invalid input

### 4.2 Leap Year Handling

Already handled by `daysInYear()` - if the current year is a leap year, the grid will have 366 dots. The grid calculator already uses `Math.ceil(totalDays / columns)` so it adjusts rows automatically.

### 4.3 Timezone Consideration

`new Date()` on the server will use the server's timezone. For a personal tool this is fine. If needed, a `tz` query parameter could be added later, but it's out of scope for now.

### 4.4 Performance Note

Generating an image with 365 individual div elements via Satori is well within its capabilities. Satori handles thousands of elements without issue. The edge runtime keeps cold starts fast.

### Success Criteria

#### Automated Verification:
- [x] `npm run build` succeeds
- [x] Invalid query params (e.g., `?width=abc&bgColor=ZZZZZZ`) don't crash the endpoint

#### Manual Verification:
- [ ] Endpoint returns sensible image even with weird/missing params

---

## Implementation Order

1. **Scaffold** the Next.js project (`create-next-app`)
2. **Create** `lib/defaults.ts`, `lib/date-utils.ts`, `lib/grid.ts`
3. **Create** `app/days/route.tsx` with the image generation logic
4. **Simplify** `app/layout.tsx` and `app/page.tsx`
5. **Test** by running dev server and opening `/days` in browser
6. **Adjust** dot sizes, spacing, and colors to match the screenshot
7. **Add** input validation

## What We're NOT Doing

- No authentication or rate limiting
- No database or persistence
- No timezone parameter (server timezone is sufficient for personal use)
- No custom font loading (using system sans-serif)
- No deployment configuration (Vercel deployment is automatic with Next.js)
- No automated test suite (the app is simple enough to verify manually)
- No dark/light mode toggle on the landing page
- No caching layer

## References

- Design screenshot: `/Users/anthony/Downloads/days.png`
- [Next.js ImageResponse docs](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Satori (HTML/CSS to SVG engine)](https://github.com/vercel/satori)
- Satori supports flexbox, border-radius, common CSS properties but NOT CSS Grid
