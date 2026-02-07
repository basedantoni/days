"use client";

import { useState, useMemo, useEffect } from "react";
import { DEFAULTS } from "../lib/defaults";

interface ColorParam {
  label: string;
  key: string;
  defaultValue: string;
}

const COLOR_PARAMS: ColorParam[] = [
  { label: "Background", key: "bgColor", defaultValue: DEFAULTS.bgColor },
  { label: "Past Days", key: "primary", defaultValue: DEFAULTS.primary },
  { label: "Future Days", key: "secondary", defaultValue: DEFAULTS.secondary },
  { label: "Today", key: "accent", defaultValue: DEFAULTS.accent },
];

export default function Home() {
  const [colors, setColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(COLOR_PARAMS.map((p) => [p.key, p.defaultValue])),
  );
  const [copied, setCopied] = useState(false);

  const daysUrl = useMemo(() => {
    const params = new URLSearchParams();
    for (const p of COLOR_PARAMS) {
      if (colors[p.key] !== p.defaultValue) {
        params.set(p.key, colors[p.key]);
      }
    }
    const qs = params.toString();
    return `/days${qs ? `?${qs}` : ""}`;
  }, [colors]);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const fullUrl = origin ? `${origin}${daysUrl}` : daysUrl;

  function handleColorChange(key: string, hex: string) {
    // <input type="color"> returns "#rrggbb", strip the #
    setColors((prev) => ({ ...prev, [key]: hex.replace("#", "") }));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <main
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Days</h1>
      <p style={{ color: "#888", marginTop: 0, fontSize: "0.9rem" }}>
        Year progress wallpaper generator
      </p>

      {/* Color pickers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {COLOR_PARAMS.map((p) => (
          <label
            key={p.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            <input
              type="color"
              value={`#${colors[p.key]}`}
              onChange={(e) => handleColorChange(p.key, e.target.value)}
              style={{
                width: 40,
                height: 40,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                padding: 0,
                background: "none",
              }}
            />
            {p.label}
          </label>
        ))}
      </div>

      {/* Copyable URL */}
      <div style={{ marginTop: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#f5f5f5",
            borderRadius: 8,
            padding: "0.5rem 0.75rem",
            fontSize: "0.8rem",
            fontFamily: "monospace",
          }}
        >
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fullUrl}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#4CAF50" : "#333",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div
        style={{
          marginTop: "1.5rem",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${daysUrl}${daysUrl.includes("?") ? "&" : "?"}width=390&height=844`}
          alt="Wallpaper preview"
          style={{ width: "100%", display: "block" }}
        />
      </div>
    </main>
  );
}
