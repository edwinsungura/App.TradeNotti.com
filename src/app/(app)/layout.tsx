import Sidebar from "@/components/Sidebar";
import { MobileNavProvider } from "@/components/MobileNav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <MobileNavProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </MobileNavProvider>
  );
}
