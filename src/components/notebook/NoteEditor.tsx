"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { CharacterCount } from "@tiptap/extensions";
import type { NoteData, TemplateData } from "@/lib/notebook";
import ImageLightbox from "./ImageLightbox";
import {
  ArrowLeftIcon,
  TemplateIcon,
  ChevronIcon,
  TrashIcon,
  PlusIcon,
  ListBulletIcon,
  ListOrderedIcon,
  ChecklistIcon,
  QuoteIcon,
  CodeBlockIcon,
  MinusIcon,
  LinkIcon,
  ImageIcon,
} from "../icons";

// Downscale + compress an image File to a JPEG data URL so it can be embedded
// in the note content (kept self-contained, like trade screenshots).
async function compressImage(file: File, max = 1280, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new window.Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

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

// --- slash-command block menu items ---------------------------------------
interface SlashItem {
  title: string;
  desc: string;
  keywords: string;
  icon: React.ReactNode;
  run?: (e: Editor) => void;
  image?: boolean; // opens the file picker instead of running a command
}

const HLabel = (n: number) => <span className="text-[13px] font-bold">H{n}</span>;

const SLASH_ITEMS: SlashItem[] = [
  { title: "Text", desc: "Plain paragraph", keywords: "text paragraph body", icon: <span className="text-[13px]">P</span>, run: (e) => e.chain().focus().setParagraph().run() },
  { title: "Heading 1", desc: "Big section heading", keywords: "h1 title heading", icon: HLabel(1), run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Heading 2", desc: "Medium heading", keywords: "h2 heading subtitle", icon: HLabel(2), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", desc: "Small heading", keywords: "h3 heading", icon: HLabel(3), run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Bullet list", desc: "Simple bulleted list", keywords: "bullet unordered list ul", icon: <ListBulletIcon size={16} />, run: (e) => e.chain().focus().toggleBulletList().run() },
  { title: "Numbered list", desc: "Ordered list", keywords: "numbered ordered list ol", icon: <ListOrderedIcon size={16} />, run: (e) => e.chain().focus().toggleOrderedList().run() },
  { title: "To-do list", desc: "Checkbox tasks", keywords: "todo task checkbox check", icon: <ChecklistIcon size={16} />, run: (e) => e.chain().focus().toggleTaskList().run() },
  { title: "Quote", desc: "Capture a quote", keywords: "quote blockquote", icon: <QuoteIcon size={16} />, run: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: "Code block", desc: "Code with syntax", keywords: "code block pre", icon: <CodeBlockIcon size={16} />, run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { title: "Image", desc: "Upload or paste a picture", keywords: "image picture photo upload", icon: <ImageIcon size={16} />, image: true },
  { title: "Divider", desc: "Horizontal rule", keywords: "divider rule hr line separator", icon: <MinusIcon size={16} />, run: (e) => e.chain().focus().setHorizontalRule().run() },
];

interface SlashState {
  query: string;
  range: { from: number; to: number };
  top: number;
  left: number;
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
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [templates, setTemplates] = useState<TemplateData[]>(initialTemplates);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const titleRef = useRef(title);
  titleRef.current = title;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Compress and insert an image (optionally at a document position).
  const insertImage = useCallback(async (file: File, pos?: number) => {
    if (!file.type.startsWith("image/")) return;
    const editor = editorRef.current;
    if (!editor) return;
    const src = await compressImage(file);
    if (pos != null) {
      editor.chain().focus().insertContentAt(pos, { type: "image", attrs: { src } }).run();
    } else {
      editor.chain().focus().setImage({ src }).run();
    }
  }, []);

  // Detect a "/" trigger at the cursor and open the block menu beside it.
  const detectSlash = useCallback((e: Editor) => {
    const { state } = e;
    const { from, empty } = state.selection;
    if (!empty) return setSlash(null);
    const $from = state.doc.resolve(from);
    const before = $from.parent.textBetween(0, $from.parentOffset, "\n", "￼");
    const m = /(?:^|\s)\/([a-zA-Z]*)$/.exec(before);
    if (!m) return setSlash(null);
    const slashPos = from - (m[1].length + 1);
    const coords = e.view.coordsAtPos(from);
    setSlash({ query: m[1], range: { from: slashPos, to: from }, top: coords.bottom + 6, left: coords.left });
    setSlashIndex(0);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Placeholder.configure({
        placeholder: "Write something, or press '/' for commands…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: true }),
      CharacterCount,
    ],
    content: (note?.content as object) ?? "",
    editorProps: {
      attributes: { class: "tiptap-content" },
      // Space opens the zoom viewer when an image node is selected.
      handleKeyDown: (view, event) => {
        if (event.key !== " ") return false;
        const sel = view.state.selection;
        if (sel instanceof NodeSelection && sel.node.type.name === "image") {
          event.preventDefault();
          setLightbox(sel.node.attrs.src as string);
          return true;
        }
        return false;
      },
      // Double-click an image to open the zoom viewer.
      handleDoubleClickOn: (_view, _pos, node) => {
        if (node.type.name === "image") {
          setLightbox(node.attrs.src as string);
          return true;
        }
        return false;
      },
      // Paste an image straight from the clipboard.
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((f) => insertImage(f));
        return true;
      },
      // Drag-and-drop image files onto the page.
      handleDrop: (view, event) => {
        const files = Array.from(
          (event as DragEvent).dataTransfer?.files ?? [],
        ).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({
          left: (event as DragEvent).clientX,
          top: (event as DragEvent).clientY,
        })?.pos;
        files.forEach((f) => insertImage(f, pos));
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      scheduleSave();
      detectSlash(editor);
    },
    onSelectionUpdate: ({ editor }) => detectSlash(editor),
    onTransaction: () => forceUpdate(),
  });
  editorRef.current = editor;

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

  // Filter slash items by the typed query.
  const filtered = useMemo(() => {
    if (!slash) return SLASH_ITEMS;
    const q = slash.query.toLowerCase();
    if (!q) return SLASH_ITEMS;
    return SLASH_ITEMS.filter(
      (i) => i.title.toLowerCase().includes(q) || i.keywords.includes(q),
    );
  }, [slash]);

  const runSlash = useCallback(
    (item: SlashItem) => {
      if (!editor || !slash) return;
      editor.chain().focus().deleteRange(slash.range).run();
      setSlash(null);
      if (item.image) imageInputRef.current?.click();
      else item.run?.(editor);
    },
    [editor, slash],
  );

  // Keyboard navigation for the slash menu (capture phase, beats ProseMirror).
  useEffect(() => {
    if (!slash) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        ev.stopPropagation();
        setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        ev.stopPropagation();
        setSlashIndex((i) => Math.max(i - 1, 0));
      } else if (ev.key === "Enter") {
        if (filtered[slashIndex]) {
          ev.preventDefault();
          ev.stopPropagation();
          runSlash(filtered[slashIndex]);
        }
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        setSlash(null);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [slash, slashIndex, filtered, runSlash]);

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

  const deletePage = async () => {
    if (timer.current) clearTimeout(timer.current);
    if (!window.confirm("Delete this page? This can't be undone.")) return;
    await fetch(`/api/notebook/notes/${date}`, { method: "DELETE" });
    router.push("/notebook");
  };

  const words = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

            <button
              onClick={deletePage}
              title="Delete page"
              aria-label="Delete page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-loss/40 hover:bg-loss-soft hover:text-loss"
            >
              <TrashIcon size={15} />
            </button>
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
          className="mb-2 w-full bg-transparent text-[32px] font-bold leading-tight tracking-tight outline-none placeholder:text-faint/60"
        />

        {/* Bubble menu — only appears when text is selected */}
        {editor && (
          <BubbleMenu
            editor={editor}
            className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-1 shadow-lg shadow-black/10"
          >
            <BubbleBtn editor={editor} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
              <span className="font-bold">B</span>
            </BubbleBtn>
            <BubbleBtn editor={editor} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <span className="italic">I</span>
            </BubbleBtn>
            <BubbleBtn editor={editor} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <span className="underline">U</span>
            </BubbleBtn>
            <BubbleBtn editor={editor} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <span className="line-through">S</span>
            </BubbleBtn>
            <BubbleBtn editor={editor} active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
              <span className="font-mono text-[12px]">{"<>"}</span>
            </BubbleBtn>
            <BubbleBtn
              editor={editor}
              active={editor.isActive("link")}
              onClick={() => {
                const prev = editor.getAttributes("link").href as string | undefined;
                const url = window.prompt("Link URL", prev ?? "https://");
                if (url === null) return;
                if (url === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
                else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
              }}
            >
              <LinkIcon size={15} />
            </BubbleBtn>
          </BubbleMenu>
        )}

        {/* Editor body */}
        <EditorContent editor={editor} />

        {/* Hidden picker for the "/image" command */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files ?? []).forEach((f) => insertImage(f));
            e.target.value = "";
          }}
        />

        {/* Slash command popup */}
        {slash && (
          <div
            className="fixed z-30 max-h-72 w-72 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl shadow-black/10"
            style={{ top: slash.top, left: slash.left }}
          >
            <div className="kicker px-2 py-1">Basic blocks</div>
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-[12px] text-faint">No matching blocks</p>
            ) : (
              filtered.map((item, i) => (
                <button
                  key={item.title}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setSlashIndex(i)}
                  onClick={() => runSlash(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                    i === slashIndex ? "bg-accent-bg" : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft">
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">{item.title}</span>
                    <span className="block truncate text-[11.5px] text-faint">{item.desc}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        <div className="mt-8 border-t border-line pt-3 text-[11.5px] text-faint">
          {words} {words === 1 ? "word" : "words"} · type{" "}
          <kbd className="rounded border border-line px-1 font-mono">/</kbd> for blocks
          {" "}· paste or drop images · select an image and press{" "}
          <kbd className="rounded border border-line px-1 font-mono">space</kbd> to zoom
        </div>
      </div>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function BubbleBtn({
  active,
  onClick,
  children,
}: {
  editor: Editor;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-[13px] transition-colors ${
        active ? "bg-accent-bg text-accent" : "text-ink-soft hover:bg-black/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}
