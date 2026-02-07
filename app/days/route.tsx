import { ImageResponse } from "next/og";
import { dayOfYear, daysInYear } from "../../lib/date-utils";
import { calculateGrid } from "../../lib/grid";
import { DEFAULTS } from "../../lib/defaults";

export const runtime = "edge";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(str);
}

function parseHex(param: string | null, fallback: string): string {
  if (param && isValidHex(param)) return "#" + param;
  return "#" + fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const width = clamp(
    parseInt(searchParams.get("width") || String(DEFAULTS.width), 10) ||
      DEFAULTS.width,
    100,
    4000,
  );
  const height = clamp(
    parseInt(searchParams.get("height") || String(DEFAULTS.height), 10) ||
      DEFAULTS.height,
    100,
    8000,
  );
  const bgColor = parseHex(searchParams.get("bgColor"), DEFAULTS.bgColor);
  const primary = parseHex(searchParams.get("primary"), DEFAULTS.primary);
  const secondary = parseHex(searchParams.get("secondary"), DEFAULTS.secondary);
  const accent = parseHex(searchParams.get("accent"), DEFAULTS.accent);

  const now = new Date();
  const currentDay = dayOfYear(now);
  const totalDays = daysInYear(now.getFullYear());
  const grid = calculateGrid(width, height, totalDays);

  const dots = [];
  for (let i = 0; i < totalDays; i++) {
    const dayNum = i + 1;
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
          borderRadius: "50%",
          backgroundColor: color,
          margin: (grid.dotSpacing - grid.dotRadius * 2) / 2,
        }}
      />,
    );
  }

  const label = `days ${currentDay}/${totalDays}`;
  const fontSize = Math.max(12, Math.floor(width * 0.03));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bgColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: grid.columns * grid.dotSpacing,
          marginTop: Math.floor(height * 0.08),
        }}
      >
        {dots}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: Math.floor(height * 0.04),
          color: accent,
          fontSize: fontSize,
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
    </div>,
    {
      width,
      height,
    },
  );
}
