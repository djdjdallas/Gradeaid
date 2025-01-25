//app/dashboard/page.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Users,
  GraduationCap,
  ClipboardCheck,
  Clock,
  Plus,
} from "lucide-react";
import { StudentPerformance } from "./components/student-performance";
import { RecentAssignments } from "./components/recent-assignments";
import { Overview } from "./components/overview";
import { GradeDistribution } from "./components/grade-distribution";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const { dashboardData, loading, error, refetch } = useDashboardData();

  useEffect(() => {
    // Check auth status
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
          <p className="text-sm">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.totalStudents > 0
                ? "+10% from last month"
                : "No students yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.averageGrade}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall class performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assignments Graded
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.assignmentsGraded}
            </div>
            <p className="text-xs text-muted-foreground">Using AI assistance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dashboardData.timeSaved)} hrs
            </div>
            <p className="text-xs text-muted-foreground">
              With AI grading assistance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Grade Overview</CardTitle>
            <CardDescription>Monthly grade averages</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={dashboardData.gradeOverview} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>
              Last {dashboardData.recentAssignments.length} assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAssignments assignments={dashboardData.recentAssignments} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Overall grade breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <GradeDistribution data={dashboardData.gradeDistribution} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Top performing students</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentPerformance students={dashboardData.students} />
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="fixed bottom-8 right-8">
        <Button
          size="lg"
          className="shadow-lg"
          onClick={() => router.push("/dashboard/assignments/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Grade New Assignment
        </Button>
      </div>
    </div>
  );
}
