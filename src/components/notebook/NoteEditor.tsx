"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { CharacterCount } from "@tiptap/extensions";
import type { NoteData, TemplateData } from "@/lib/notebook";
import EditorToolbar from "./EditorToolbar";
import { ArrowLeftIcon, TemplateIcon, ChevronIcon, TrashIcon, PlusIcon } from "../icons";

type Status = "idle" | "saving" | "saved";

function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function NoteEditor({
  date,
  note,
  templates: initialTemplates,
}: {
  date: string;
  note: NoteData | null;
  templates: TemplateData[];
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [templates, setTemplates] = useState<TemplateData[]>(initialTemplates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const titleRef = useRef(title);
  titleRef.current = title;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Placeholder.configure({
        placeholder: "Start writing, or pick a template above…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
    ],
    content: (note?.content as object) ?? "",
    editorProps: { attributes: { class: "tiptap-content" } },
    onUpdate: () => scheduleSave(),
    onTransaction: () => forceUpdate(),
  });

  const doSave = useCallback(async () => {
    if (!editor) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/notebook/notes/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleRef.current, content: editor.getJSON() }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
    } catch {
      setStatus("idle");
    }
  }, [editor, date]);

  const scheduleSave = useCallback(() => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(doSave, 900);
  }, [doSave]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const applyTemplate = (t: TemplateData) => {
    if (!editor) return;
    editor.commands.setContent((t.content as object) ?? "");
    if (!titleRef.current) setTitle(t.name);
    setMenuOpen(false);
    scheduleSave();
  };

  const saveAsTemplate = async () => {
    if (!editor) return;
    const name = window.prompt("Template name", title || "My template");
    if (!name?.trim()) return;
    const res = await fetch("/api/notebook/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), content: editor.getJSON() }),
    });
    if (res.ok) {
      const { template } = await res.json();
      setTemplates((prev) => [template, ...prev]);
    }
  };

  const removeTemplate = async (id: string) => {
    await fetch(`/api/notebook/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const words = editor?.storage.characterCount?.words() ?? 0;
  const isEmpty = editor?.isEmpty ?? true;
  const showStarter = !note && isEmpty && !title;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/notebook"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
          >
            <ArrowLeftIcon size={15} /> {dayLabel(date)}
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-faint">
              {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
            </span>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
              >
                <TemplateIcon size={15} /> Templates
                <ChevronIcon size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5">
                  <div className="kicker px-2 py-1.5">Apply template</div>
                  {templates.length === 0 ? (
                    <p className="px-2 py-2 text-[12px] text-faint">No templates yet.</p>
                  ) : (
                    templates.map((t) => (
                      <div key={t.id} className="group flex items-center">
                        <button
                          onClick={() => applyTemplate(t)}
                          className="flex-1 truncate rounded-md px-2 py-1.5 text-left text-[13px] text-ink-soft hover:bg-black/[0.04]"
                        >
                          {t.name}
                        </button>
                        <button
                          onClick={() => removeTemplate(t.id)}
                          aria-label="Delete template"
                          className="mr-1 hidden h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-loss-soft hover:text-loss group-hover:flex"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    ))
                  )}
                  <div className="my-1 h-px bg-line" />
                  <button
                    onClick={() => {
                      saveAsTemplate();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-accent hover:bg-accent-bg/60"
                  >
                    <PlusIcon size={14} /> Save current page as template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave();
          }}
          placeholder="Untitled"
          className="mb-3 w-full bg-transparent text-[32px] font-bold leading-tight tracking-tight outline-none placeholder:text-faint/60"
        />

        {/* Starter template chooser (only on a fresh blank page) */}
        {showStarter && templates.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-faint">Start from:</span>
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className="rounded-full border border-line px-3 py-1 text-[12.5px] text-ink-soft hover:border-accent/50 hover:text-accent"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar + editor */}
        {editor && <EditorToolbar editor={editor} />}
        <div className="mt-3" onClick={() => editor?.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>

        <div className="mt-6 border-t border-line pt-3 text-[11.5px] text-faint">
          {words} {words === 1 ? "word" : "words"}
          {note && " · saved to this day"}
        </div>
      </div>
    </div>
  );
}
