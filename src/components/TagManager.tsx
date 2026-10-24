import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
}) => {
  const [newTagText, setNewTagText] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagText.trim().replace(/^#/, "");
    if (!tag) return;
    if (!tags.includes(tag)) {
      onAddTag(tag);
    }
    setNewTagText("");
    setShowTagInput(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700/60 text-zinc-300"
        >
          #{tag}
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="text-zinc-500 hover:text-zinc-200"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {showTagInput ? (
        <form onSubmit={handleAddTag} className="inline-flex items-center">
          <input
            type="text"
            autoFocus
            value={newTagText}
            onChange={(e) => setNewTagText(e.target.value)}
            onBlur={() => setShowTagInput(false)}
            placeholder="tag name..."
            className="px-2 py-0.5 text-xs bg-zinc-800 border border-amber-500/50 rounded-full text-zinc-100 focus:outline-none w-24"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowTagInput(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition"
        >
          <Plus className="w-3 h-3" /> Add tag
        </button>
      )}
    </div>
  );
};
