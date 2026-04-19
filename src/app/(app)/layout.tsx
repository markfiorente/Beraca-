import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-navy">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar role={session.user.role} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile nav */}
        <MobileNav role={session.user.role} userName={session.user.name} />

        {/* Desktop topbar */}
        <div className="hidden lg:flex">
          <div className="w-full">
            <Topbar userName={session.user.name} userRole={session.user.role} />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-navy p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
