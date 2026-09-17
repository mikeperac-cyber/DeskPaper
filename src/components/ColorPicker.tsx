import React from "react";
import { NoteColor } from "../types/note";

export const COLOR_THEMES: Record<
  NoteColor,
  {
    name: string;
    bg: string;
    text: string;
    accent: string;
    border: string;
    badge: string;
  }
> = {
  yellow: {
    name: "Canary Yellow",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-950 dark:text-amber-100",
    accent: "bg-amber-400",
    border: "border-amber-300 dark:border-amber-800/60",
    badge: "bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200",
  },
  green: {
    name: "Mint Green",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-950 dark:text-emerald-100",
    accent: "bg-emerald-400",
    border: "border-emerald-300 dark:border-emerald-800/60",
    badge: "bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200",
  },
  blue: {
    name: "Sky Blue",
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-950 dark:text-sky-100",
    accent: "bg-sky-400",
    border: "border-sky-300 dark:border-sky-800/60",
    badge: "bg-sky-200/80 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200",
  },
  pink: {
    name: "Coral Pink",
    bg: "bg-rose-100 dark:bg-rose-950/40",
    text: "text-rose-950 dark:text-rose-100",
    accent: "bg-rose-400",
    border: "border-rose-300 dark:border-rose-800/60",
    badge: "bg-rose-200/80 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200",
  },
  purple: {
    name: "Lavender",
    bg: "bg-purple-100 dark:bg-purple-950/40",
    text: "text-purple-950 dark:text-purple-100",
    accent: "bg-purple-400",
    border: "border-purple-300 dark:border-purple-800/60",
    badge: "bg-purple-200/80 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200",
  },
  dark: {
    name: "Graphite",
    bg: "bg-zinc-900 dark:bg-zinc-900",
    text: "text-zinc-100",
    accent: "bg-zinc-600",
    border: "border-zinc-700",
    badge: "bg-zinc-800 text-zinc-300",
  },
};

interface ColorPickerProps {
  currentColor: NoteColor;
  onSelectColor: (color: NoteColor) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onSelectColor,
}) => {
  const colors: NoteColor[] = ["yellow", "green", "blue", "pink", "purple", "dark"];

  return (
    <div className="flex items-center gap-1.5 bg-zinc-800/60 backdrop-blur p-1 rounded-full border border-zinc-700/50">
      {colors.map((c) => {
        const theme = COLOR_THEMES[c];
        const isSelected = currentColor === c;
        return (
          <button
            key={c}
            type="button"
            title={theme.name}
            onClick={() => onSelectColor(c)}
            className={`w-5 h-5 rounded-full transition-all ${theme.accent} ${
              isSelected
                ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                : "opacity-75 hover:opacity-100 hover:scale-105"
            }`}
          />
        );
      })}
    </div>
  );
};
