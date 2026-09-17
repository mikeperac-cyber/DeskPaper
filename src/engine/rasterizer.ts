import { Note, HardwareSettings, DISPLAY_PRESETS } from "../types/note";
import { applyFloydSteinberg, applyThreshold, pack1BitBuffer } from "./dither";

export interface RenderResult {
  dataUrl: string;
  packedBuffer: Uint8Array;
  width: number;
  height: number;
  byteLength: number;
}

/**
 * Word wrap helper for canvas context
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + " " + word : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

/**
 * Render a note to exact 1-bit monochrome E-Paper buffer and dataURL
 */
export function renderNoteToBuffer(
  note: Note,
  settings: HardwareSettings
): RenderResult {
  const preset = DISPLAY_PRESETS[settings.selectedModel];
  let width = preset.width;
  let height = preset.height;

  // Swap dimensions if portrait
  if (settings.orientation === "portrait") {
    const temp = width;
    width = height;
    height = temp;
  }

  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not initialize 2D Canvas context");
  }

  // Disable image smoothing for sharp pixels
  ctx.imageSmoothingEnabled = false;

  // Background: Pure White
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer border padding
  const paddingX = 16;
  let currentY = 16;
  const contentWidth = width - paddingX * 2;

  // Ink color: Pure Black
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = "#000000";

  // Optional Header
  if (settings.showTitleHeader && note.title.trim()) {
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
    ctx.textBaseline = "top";
    
    // Draw Title
    const titleLines = wrapText(ctx, note.title.trim(), contentWidth);
    for (const line of titleLines) {
      ctx.fillText(line, paddingX, currentY);
      currentY += 22;
    }

    // Draw Tag pills if any
    if (note.tags && note.tags.length > 0) {
      currentY += 2;
      let tagX = paddingX;
      ctx.font = "10px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      for (const tag of note.tags) {
        const tagText = "#" + tag;
        const tagWidth = ctx.measureText(tagText).width + 8;
        if (tagX + tagWidth < width - paddingX) {
          ctx.strokeRect(tagX, currentY, tagWidth, 16);
          ctx.fillText(tagText, tagX + 4, currentY + 3);
          tagX += tagWidth + 6;
        }
      }
      currentY += 22;
    }

    // Divider rule
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingX, currentY);
    ctx.lineTo(width - paddingX, currentY);
    ctx.stroke();
    currentY += 12;
  }

  // Calculate available height for content (leave room for footer if enabled)
  const footerHeight = settings.showSyncTimestamp ? 26 : 8;
  const maxContentY = height - footerHeight;

  // Render Content based on mode
  if (note.mode === "checklist") {
    // Checklist Mode
    const items = note.checklist || [];
    const boxSize = 13;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (currentY + boxSize > maxContentY) break; // Screen space full

      const boxX = paddingX;
      const boxY = currentY + 1;

      // Draw Checkbox Square
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, boxY, boxSize, boxSize);

      if (item.completed) {
        // Draw Checkmark
        ctx.beginPath();
        ctx.moveTo(boxX + 3, boxY + 6);
        ctx.lineTo(boxX + 6, boxY + 10);
        ctx.lineTo(boxX + 11, boxY + 3);
        ctx.stroke();
      }

      // Draw Item Text
      ctx.font = "14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
      ctx.textBaseline = "top";
      const itemText = item.text || "Empty item";
      const textX = boxX + boxSize + 10;
      const textWidth = width - textX - paddingX;
      const lines = wrapText(ctx, itemText, textWidth);

      for (let j = 0; j < lines.length; j++) {
        if (currentY > maxContentY) break;
        const line = lines[j];
        ctx.fillText(line, textX, currentY);

        // If completed, draw strikethrough line
        if (item.completed) {
          const lineWidth = ctx.measureText(line).width;
          const strikeY = currentY + 8;
          ctx.beginPath();
          ctx.moveTo(textX, strikeY);
          ctx.lineTo(textX + lineWidth, strikeY);
          ctx.stroke();
        }

        currentY += 18;
      }

      currentY += 6; // Item spacing
    }
  } else {
    // Markdown / Rich Text Mode
    const rawLines = (note.content || "").split("\n");

    for (let i = 0; i < rawLines.length; i++) {
      if (currentY > maxContentY) break;
      const line = rawLines[i];

      if (line.startsWith("# ")) {
        // Heading 1
        ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
        ctx.textBaseline = "top";
        const hLines = wrapText(ctx, line.replace(/^#\s+/, ""), contentWidth);
        for (const hl of hLines) {
          if (currentY > maxContentY) break;
          ctx.fillText(hl, paddingX, currentY);
          currentY += 24;
        }
        currentY += 4;
      } else if (line.startsWith("## ")) {
        // Heading 2
        ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
        ctx.textBaseline = "top";
        const hLines = wrapText(ctx, line.replace(/^##\s+/, ""), contentWidth);
        for (const hl of hLines) {
          if (currentY > maxContentY) break;
          ctx.fillText(hl, paddingX, currentY);
          currentY += 20;
        }
        currentY += 3;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        // Bullet item
        ctx.font = "14px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
        ctx.textBaseline = "top";
        const bulletX = paddingX + 4;
        // Draw solid square bullet
        ctx.fillRect(bulletX, currentY + 5, 4, 4);

        const bLines = wrapText(ctx, line.replace(/^[-*]\s+/, ""), contentWidth - 14);
        for (let k = 0; k < bLines.length; k++) {
          if (currentY > maxContentY) break;
          ctx.fillText(bLines[k], paddingX + 16, currentY);
          currentY += 18;
        }
        currentY += 2;
      } else if (line.trim() === "") {
        // Paragraph gap
        currentY += 10;
      } else {
        // Regular text
        ctx.font = "14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
        ctx.textBaseline = "top";
        const regLines = wrapText(ctx, line, contentWidth);
        for (const rl of regLines) {
          if (currentY > maxContentY) break;
          ctx.fillText(rl, paddingX, currentY);
          currentY += 18;
        }
      }
    }
  }

  // Footer (Last Synced info)
  if (settings.showSyncTimestamp) {
    const footerY = height - 20;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, footerY - 4);
    ctx.lineTo(width - paddingX, footerY - 4);
    ctx.stroke();

    ctx.font = "10px -apple-system, BlinkMacSystemFont, ui-monospace, monospace";
    ctx.textBaseline = "top";
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const footerLeft = "DeskPaper • " + timeStr;
    const footerRight = width + "x" + height + "px";

    ctx.fillText(footerLeft, paddingX, footerY);
    const rightWidth = ctx.measureText(footerRight).width;
    ctx.fillText(footerRight, width - paddingX - rightWidth, footerY);
  }

  // Read raw RGBA pixels from canvas
  const imageData = ctx.getImageData(0, 0, width, height);

  // Apply Dithering / Threshold to produce 1-bit monochrome array (0 = black, 1 = white)
  const mono =
    settings.ditherMode === "floyd-steinberg"
      ? applyFloydSteinberg(imageData)
      : applyThreshold(imageData);

  // Pack 1-bit array into bytes
  const packedBuffer = pack1BitBuffer(
    mono,
    width,
    height,
    settings.invertColors
  );

  return {
    dataUrl: canvas.toDataURL("image/png"),
    packedBuffer,
    width,
    height,
    byteLength: packedBuffer.byteLength,
  };
}
