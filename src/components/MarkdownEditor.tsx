import React, { useRef } from "react";
import { Heading1, Heading2, Bold, List, Quote } from "lucide-react";

interface MarkdownEditorProps {
  content: string;
  onChangeContent: (content: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChangeContent,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = content;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || "text") + suffix;

    const updated =
      current.substring(0, start) + replacement + current.substring(end);
    onChangeContent(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + replacement.length - suffix.length
      );
    }, 10);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Markdown Toolbar */}
      <div className="flex items-center gap-1 pb-2 mb-2 border-b border-zinc-800/60 text-zinc-400">
        <button
          type="button"
          onClick={() => insertMarkdown("# ")}
          title="Heading 1"
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("## ")}
          title="Heading 2"
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("**", "**")}
          title="Bold"
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("- ")}
          title="Bullet List"
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("> ")}
          title="Quote"
          className="p-1.5 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* Markdown Editor Textarea */}
      <textarea
        ref={textareaRef}
        id="markdown-editor-area"
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
        placeholder="Write your note with markdown headings (#), bullets (-), or quotes (>)..."
        className="flex-1 w-full bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
      />
    </div>
  );
};
