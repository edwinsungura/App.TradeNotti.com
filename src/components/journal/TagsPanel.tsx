"use client";

import { useState } from "react";
import { PlusIcon } from "../icons";

export default function TagsPanel({
  tradeId,
  tags,
  onChange,
}: {
  tradeId: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const save = async (next: string[]) => {
    onChange(next);
    await fetch(`/api/trades/${tradeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
  };

  const add = () => {
    const name = value.trim();
    if (name && !tags.includes(name)) save([...tags, name]);
    setValue("");
    setAdding(false);
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="kicker mb-3">Tags</div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[12.5px] text-ink-soft"
          >
            {tag}
            <button
              onClick={() => save(tags.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="leading-none text-faint hover:text-loss"
            >
              ×
            </button>
          </span>
        ))}

        {adding ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") {
                setValue("");
                setAdding(false);
              }
            }}
            placeholder="Tag name"
            className="w-28 rounded-md border border-accent/40 px-2 py-1 text-[12.5px] outline-none"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-line px-2.5 py-1 text-[12.5px] text-muted hover:border-accent/50 hover:text-accent"
          >
            <PlusIcon size={13} /> Add
          </button>
        )}
      </div>
    </section>
  );
}
