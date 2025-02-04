"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { MobileNav } from "./components/mobile-nav";
import { supabase } from "@/lib/supabase";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b bg-background px-4 md:hidden">
        <MobileNav onLogout={handleLogout} />
        <div className="ml-4 font-semibold">GradeAid</div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex min-w-[240px] bg-card border-r">
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="md:p-0 p-4 mt-16 md:mt-0">{children}</div>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
