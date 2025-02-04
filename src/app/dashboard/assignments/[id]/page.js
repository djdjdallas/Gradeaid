"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AnalysisResults } from "../../components/Analysis-Results";

export default function AssignmentDetailsPage({ params }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]); // Updated dependency

  async function fetchAssignmentDetails() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (teacherError) throw teacherError;

      const { data, error } = await supabase
        .from("paper_analyses")
        .select(
          `
          *,
          students (
            full_name,
            grade_level
          )
        `
        )
        .eq("id", assignmentId) // Using resolved ID
        .eq("teacher_id", teacherData.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Assignment not found");

      setAssignment(data);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast.error("Failed to load assignment details", {
        description: error.message,
      });
      router.push("/dashboard/assignments");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-xl font-semibold">Assignment not found</p>
        <Button onClick={() => router.push("/dashboard/assignments")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            Assignment Details
          </h2>
          <p className="text-muted-foreground">
            Viewing graded assignment for {assignment.students?.full_name}
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/assignments")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getScoreColor(assignment.score)}>
                {assignment.score}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignment.subject}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignment.students?.full_name}
            </div>
            <p className="text-xs text-muted-foreground">
              Grade Level: {assignment.students?.grade_level || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(assignment.analyzed_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisResults
            result={{
              questions: assignment.questions_analysis,
              overallAssessment: assignment.overall_assessment,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
