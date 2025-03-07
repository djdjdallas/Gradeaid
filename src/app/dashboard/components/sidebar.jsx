//app/dashboard/components/sidebar.jsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  Home,
  FileText,
  ClipboardPen,
  HelpCircle,
  FilePlus,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Assignments",
    href: "/dashboard/assignments",
    icon: FileText,
  },
  {
    title: "Grades",
    href: "/dashboard/grades",
    icon: GraduationCap,
  },
  {
    title: "Paper Analyzer",
    href: "/dashboard/paper-grader",
    icon: ClipboardPen,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
  },
  {
    title: "Test Generator",
    href: "/dashboard/test-generator",
    icon: FilePlus,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

export function Sidebar({ onLogout }) {
  const pathname = usePathname();

  return (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center px-3 mb-14">
            <h2 className="text-lg font-semibold">GradeAid</h2>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent" : "transparent"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
