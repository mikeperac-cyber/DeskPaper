import React, { useState } from "react";
import { ChecklistItem } from "../types/note";
import { CheckSquare, Plus, X } from "lucide-react";

interface ChecklistEditorProps {
  checklist?: ChecklistItem[];
  onUpdateChecklist: (checklist: ChecklistItem[]) => void;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  checklist = [],
  onUpdateChecklist,
}) => {
  const [newChecklistText, setNewChecklistText] = useState("");

  const completedCount = checklist.filter((c) => c.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: "item-" + Date.now(),
      text: newChecklistText.trim(),
      completed: false,
    };
    onUpdateChecklist([...checklist, newItem]);
    setNewChecklistText("");
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateChecklist(updated);
  };

  const handleUpdateChecklistText = (itemId: string, text: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    onUpdateChecklist(updated);
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    onUpdateChecklist(updated);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>
              Tasks: {completedCount} / {totalCount} completed
            </span>
            <span className="font-mono font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Checklist items scroll area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800/80 group hover:border-zinc-700 transition"
          >
            <button
              type="button"
              onClick={() => handleToggleChecklist(item.id)}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                item.completed
                  ? "bg-amber-500 border-amber-500 text-zinc-950"
                  : "border-zinc-600 hover:border-amber-400"
              }`}
            >
              {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
            </button>

            <input
              type="text"
              value={item.text}
              onChange={(e) =>
                handleUpdateChecklistText(item.id, e.target.value)
              }
              className={`flex-1 bg-transparent text-sm focus:outline-none transition ${
                item.completed
                  ? "line-through text-zinc-500"
                  : "text-zinc-200"
              }`}
            />

            <button
              type="button"
              onClick={() => handleDeleteChecklistItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item form */}
      <form
        onSubmit={handleAddChecklistItem}
        className="mt-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={newChecklistText}
          onChange={(e) => setNewChecklistText(e.target.value)}
          placeholder="Add a new checklist item (Press Enter)..."
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
        />
        <button
          type="submit"
          className="p-2.5 bg-amber-500 text-zinc-950 rounded-xl hover:bg-amber-400 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
