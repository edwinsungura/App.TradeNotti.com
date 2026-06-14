import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import NoteEditor from "@/components/notebook/NoteEditor";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getNoteById, listTemplates } from "@/lib/notebook";

export const dynamic = "force-dynamic";

export default async function NotePage({
  params,
}: {
  params: Promise<{ date: string; id: string }>;
}) {
  const { id } = await params;

  const [user, accounts, account] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(),
  ]);
  if (!user) notFound();

  const [note, templates] = await Promise.all([
    getNoteById(user.id, id),
    listTemplates(user.id),
  ]);
  if (!note) notFound();

  const initial = (user.name ?? "T").charAt(0).toUpperCase();

  return (
    <>
      <TopBar
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.label,
          broker: a.broker,
          currency: a.currency,
          type: a.type,
        }))}
        activeId={account?.id ?? ""}
        userInitial={initial}
      />
      <NoteEditor note={note} templates={templates} />
    </>
  );
}
