"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaHeading,
  FaQuoteLeft,
  FaArrowRotateLeft,
  FaArrowRotateRight,
} from "react-icons/fa6";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  rows = 3,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 dark:border-white/10 dark:bg-white/10">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("bold")
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Bold (Ctrl+B)"
        >
          <FaBold size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("italic")
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Italic (Ctrl+I)"
        >
          <FaItalic size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("strike")
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Strikethrough"
        >
          <span className="line-through text-sm font-bold">S</span>
        </button>

        <div className="w-px bg-slate-200 dark:bg-white/10" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("heading", { level: 2 })
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Heading"
        >
          <FaHeading size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("bulletList")
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Bullet List"
        >
          <FaListUl size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("orderedList")
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Ordered List"
        >
          <FaListOl size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={!editor.can().chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg transition ${
            editor.isActive("blockquote")
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          } disabled:opacity-50`}
          title="Quote"
        >
          <FaQuoteLeft size={16} />
        </button>

        <div className="w-px bg-slate-200 dark:bg-white/10" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded-lg transition bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 disabled:opacity-50"
          title="Undo"
        >
          <FaArrowRotateLeft size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded-lg transition bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 disabled:opacity-50"
          title="Redo"
        >
          <FaArrowRotateRight size={16} />
        </button>
      </div>

      {/* Editor */}
      <div className="prose prose-sm dark:prose-invert max-w-none p-3">
        <EditorContent
          editor={editor}
          className="min-h-[120px] focus:outline-none text-slate-900 dark:text-white [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:min-h-[120px]"
        />
      </div>
    </div>
  );
}
