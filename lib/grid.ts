export interface GridConfig {
  columns: number;
  rows: number;
  totalDots: number;
  dotRadius: number;
  dotSpacing: number;
  gridWidth: number;
  gridHeight: number;
  offsetX: number;
  offsetY: number;
}

export function calculateGrid(
  imageWidth: number,
  imageHeight: number,
  totalDays: number,
): GridConfig {
  const columns = 15;
  const rows = Math.ceil(totalDays / columns);

  const availableWidth = imageWidth * 0.8;
  const availableHeight = imageHeight * 0.75;

  const spacingByWidth = availableWidth / columns;
  const spacingByHeight = availableHeight / rows;
  const dotSpacing = Math.floor(Math.min(spacingByWidth, spacingByHeight));

  const dotRadius = Math.min(16, Math.floor(dotSpacing * 0.35));

  const gridWidth = (columns - 1) * dotSpacing;
  const gridHeight = (rows - 1) * dotSpacing;

  const offsetX = Math.floor((imageWidth - gridWidth) / 2);
  const offsetY =
    Math.floor((imageHeight - gridHeight) / 2) - Math.floor(imageHeight * 0.06);

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
