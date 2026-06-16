"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ProfileData, ManagedAccount } from "@/lib/settings";
import AccountModal from "./AccountModal";
import { CheckIcon, PlusIcon, ChevronIcon, TrashIcon, ImageIcon, LogoutIcon } from "../icons";

async function compress(file: File, max = 400, quality = 0.85): Promise<string> {
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

function badge(broker: string): string {
  return (
    broker
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AC"
  );
}

function money(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

const SUB_FEATURES = [
  "Unlimited trades with notes & screenshots",
  "Multiple trading accounts",
  "Calendar + analytics + rules",
  "Export & integrations",
];

export default function SettingsView({
  profile: initialProfile,
  accounts: initialAccounts,
}: {
  profile: ProfileData;
  accounts: ManagedAccount[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialProfile.name);
  const [avatar, setAvatar] = useState<string | null>(initialProfile.avatarUrl);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [profileError, setProfileError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<ManagedAccount[]>(initialAccounts);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; account?: ManagedAccount } | null>(null);

  const signOut = () => router.push("/signin");

  const saveProfile = async (patch: { name?: string; avatarUrl?: string | null }) => {
    setProfileStatus("saving");
    setProfileError(null);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not save.");
      setProfileStatus("saved");
      setTimeout(() => setProfileStatus("idle"), 1500);
    } catch (e) {
      setProfileStatus("idle");
      setProfileError(e instanceof Error ? e.message : "Could not save.");
    }
  };

  const pickAvatar = async (file: File) => {
    const dataUrl = await compress(file);
    setAvatar(dataUrl);
    saveProfile({ avatarUrl: dataUrl });
  };

  const archive = async (a: ManagedAccount) => {
    setMenuOpen(null);
    setAccounts((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, archived: !x.archived } : x)),
    );
    await fetch(`/api/accounts/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !a.archived }),
    });
  };

  const remove = async (a: ManagedAccount) => {
    setMenuOpen(null);
    if (
      !window.confirm(
        `Delete "${a.label}"? This permanently removes the account and all its trades.`,
      )
    )
      return;
    setAccounts((prev) => prev.filter((x) => x.id !== a.id));
    await fetch(`/api/accounts/${a.id}`, { method: "DELETE" });
  };

  const onSaved = (account: ManagedAccount) => {
    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === account.id);
      return exists ? prev.map((a) => (a.id === account.id ? account : a)) : [...prev, account];
    });
    setModal(null);
  };

  const initial = (name || "T").charAt(0).toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="kicker mb-1">Account</div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>

        {/* Profile */}
        <section className="mb-5 rounded-2xl border border-line bg-surface p-6">
          <div className="kicker mb-4">Profile</div>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <span className="block h-20 w-20 overflow-hidden rounded-full">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-ink text-2xl font-semibold text-white">
                    {initial}
                  </span>
                )}
              </span>
              <button
                onClick={() => avatarRef.current?.click()}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-sm transition-colors hover:text-accent"
              >
                <ImageIcon size={15} />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="kicker mb-1 block">Display name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => name !== initialProfile.name && saveProfile({ name })}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-accent/40"
                  />
                </label>
                <label className="block">
                  <span className="kicker mb-1 block">Email</span>
                  <input
                    value={initialProfile.email}
                    readOnly
                    disabled
                    title="Email can't be changed"
                    className="w-full cursor-not-allowed rounded-lg border border-line bg-black/[0.02] px-3 py-2.5 text-[14px] text-muted outline-none"
                  />
                </label>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[12px]">
                <span className="text-faint">@{initialProfile.username}</span>
                {avatar && (
                  <button
                    onClick={() => {
                      setAvatar(null);
                      saveProfile({ avatarUrl: null });
                    }}
                    className="text-muted hover:text-loss"
                  >
                    Remove photo
                  </button>
                )}
                <span className="ml-auto text-faint">
                  {profileStatus === "saving" ? "Saving…" : profileStatus === "saved" ? "Saved" : ""}
                </span>
              </div>
              {profileError && <p className="mt-1 text-[12px] text-loss">{profileError}</p>}
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="mb-5 rounded-2xl border border-line bg-surface p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="kicker mb-1">Subscription</div>
              <h2 className="text-[15px] font-semibold">
                Pro · <span className="font-normal text-muted">monthly</span>
              </h2>
            </div>
            <span className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-faint">
              Billing portal
            </span>
          </div>
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="sm:w-44">
              <div className="num text-[28px] font-bold tracking-tight">
                $9.99<span className="text-[14px] font-medium text-faint">/mo</span>
              </div>
              <p className="mt-1 text-[12px] text-faint">Renews monthly · demo plan</p>
            </div>
            <ul className="flex-1 space-y-2">
              {SUB_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13.5px] text-ink-soft">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-profit-soft text-profit">
                    <CheckIcon size={11} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Trading accounts */}
        <section className="rounded-2xl border border-line bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="kicker mb-1">Trading accounts</div>
              <h2 className="text-[15px] font-semibold">Connected</h2>
            </div>
            <button
              onClick={() => setModal({ mode: "create" })}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent/90"
            >
              <PlusIcon size={15} /> Add account
            </button>
          </div>

          <ul className="flex flex-col">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 border-b border-line/60 py-3.5 last:border-0"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold ${
                    a.archived ? "bg-black/[0.05] text-faint" : "bg-accent text-white"
                  }`}
                >
                  {badge(a.broker)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-[14px] font-semibold ${a.archived ? "text-faint" : "text-ink"}`}>
                      {a.type === "LIVE" ? "Live" : "Demo"} · {a.label}
                    </span>
                    {a.archived && (
                      <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                        Archived
                      </span>
                    )}
                  </span>
                  <span className="block text-[12px] text-faint">
                    {a.broker} · {a.currency} · {money(a.balance, a.currency)}
                  </span>
                </span>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
                  >
                    Manage <ChevronIcon size={14} />
                  </button>
                  {menuOpen === a.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5">
                        <button
                          onClick={() => {
                            setModal({ mode: "edit", account: a });
                            setMenuOpen(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-soft hover:bg-black/[0.04]"
                        >
                          Edit details
                        </button>
                        <button
                          onClick={() => archive(a)}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-soft hover:bg-black/[0.04]"
                        >
                          {a.archived ? "Unarchive" : "Archive"}
                        </button>
                        <button
                          onClick={() => remove(a)}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-loss hover:bg-loss-soft"
                        >
                          <TrashIcon size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {accounts.length === 0 && (
            <p className="py-6 text-center text-sm text-faint">
              No accounts yet. Add your first trading account.
            </p>
          )}
        </section>

        {/* Sign out */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-loss/40 hover:bg-loss-soft hover:text-loss"
          >
            <LogoutIcon size={16} /> Sign out
          </button>
        </div>
      </div>

      {modal && (
        <AccountModal
          mode={modal.mode}
          account={modal.account}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
