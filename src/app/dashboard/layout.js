"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { supabase } from "@/lib/supabase";
import { Toaster } from "sonner"; // Import Toaster

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex min-w-[240px] bg-card border-r">
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}
