import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import NoteEditor from "@/components/notebook/NoteEditor";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getNote, listTemplates, isValidDate } from "@/lib/notebook";

export const dynamic = "force-dynamic";

export default async function NotePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidDate(date)) notFound();

  const [user, accounts, account] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(),
  ]);

  const [note, templates] = user
    ? await Promise.all([getNote(user.id, date), listTemplates(user.id)])
    : [null, []];

  const initial = (user?.name ?? "T").charAt(0).toUpperCase();

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
      <NoteEditor date={date} note={note} templates={templates} />
    </>
  );
}
