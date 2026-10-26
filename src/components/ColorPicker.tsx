import React from "react";
import { NoteColor } from "../types/note";
import { COLOR_THEMES } from "../constants/theme";

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
