"use client";

import type { Editor } from "@tiptap/react";
import {
  ListBulletIcon,
  ListOrderedIcon,
  ChecklistIcon,
  QuoteIcon,
  CodeBlockIcon,
  LinkIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  UndoIcon,
  RedoIcon,
  MinusIcon,
} from "../icons";

function Btn({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-[13px] transition-colors disabled:opacity-30 ${
        active
          ? "bg-accent-bg text-accent"
          : "text-ink-soft hover:bg-black/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-line" />;

export default function EditorToolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-xl border border-line bg-surface/95 px-2 py-1.5 backdrop-blur">
      {([1, 2, 3] as const).map((level) => (
        <Btn
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          <span className="font-semibold">H{level}</span>
        </Btn>
      ))}
      <Btn
        title="Body text"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <span className="text-[12px]">P</span>
      </Btn>

      <Divider />

      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Btn>
      <Btn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <span className="font-mono text-[12px]">{"<>"}</span>
      </Btn>
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon size={16} />
      </Btn>

      <Divider />

      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <ListBulletIcon size={16} />
      </Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrderedIcon size={16} />
      </Btn>
      <Btn title="To-do list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ChecklistIcon size={16} />
      </Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <QuoteIcon size={16} />
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <CodeBlockIcon size={16} />
      </Btn>
      <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <MinusIcon size={16} />
      </Btn>

      <Divider />

      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeftIcon size={16} />
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenterIcon size={16} />
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRightIcon size={16} />
      </Btn>

      <Divider />

      <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <UndoIcon size={16} />
      </Btn>
      <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <RedoIcon size={16} />
      </Btn>
    </div>
  );
}
