import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Download,
  Calendar,
  GraduationCap,
  BarChart as BarChartIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentProgressReport({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [progressData, setProgressData] = useState({
    grades: [],
    subjects: [],
    recent: [],
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (studentId) {
      fetchStudentProgress(studentId);
    }
  }, [studentId]);

  const fetchStudentProgress = async (id) => {
    try {
      setLoading(true);

      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

      if (studentError) throw studentError;

      // Fetch all paper analyses for this student
      const { data: analyses, error: analysesError } = await supabase
        .from("paper_analyses")
        .select("*")
        .eq("student_id", id)
        .order("analyzed_at", { ascending: false });

      if (analysesError) throw analysesError;

      setStudentData(student);

      // Process analyses data for charts
      const gradesByMonth = processGradesByMonth(analyses || []);
      const subjectPerformance = processSubjectPerformance(analyses || []);

      setProgressData({
        grades: gradesByMonth,
        subjects: subjectPerformance,
        recent: (analyses || []).slice(0, 5),
        all: analyses || [],
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load student progress");
    } finally {
      setLoading(false);
    }
  };

  const processGradesByMonth = (analyses) => {
    const monthlyGrades = {};

    analyses.forEach((analysis) => {
      const date = new Date(analysis.analyzed_at);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyGrades[monthYear]) {
        monthlyGrades[monthYear] = {
          total: 0,
          count: 0,
        };
      }

      monthlyGrades[monthYear].total += analysis.score;
      monthlyGrades[monthYear].count++;
    });

    return Object.entries(monthlyGrades)
      .map(([month, data]) => ({
        month,
        average: Math.round(data.total / data.count),
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
  };

  const processSubjectPerformance = (analyses) => {
    const subjectGrades = {};

    analyses.forEach((analysis) => {
      if (!subjectGrades[analysis.subject]) {
        subjectGrades[analysis.subject] = {
          total: 0,
          count: 0,
        };
      }

      subjectGrades[analysis.subject].total += analysis.score;
      subjectGrades[analysis.subject].count++;
    });

    return Object.entries(subjectGrades)
      .map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.average - a.average);
  };

  const calculateOverallProgress = () => {
    if (!progressData.all.length) return 0;
    const totalAssignments = progressData.all.length;
    const completedAssignments = progressData.all.filter(
      (a) => a.score != null
    ).length;
    return Math.round((completedAssignments / totalAssignments) * 100);
  };

  const handleDownloadReport = () => {
    toast.success("Report download started");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-500">No student data available</p>
      </div>
    );
  }

  const averageGrade =
    progressData.grades.length > 0
      ? Math.round(
          progressData.grades.reduce((acc, curr) => acc + curr.average, 0) /
            progressData.grades.length
        )
      : 0;

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${studentData.full_name}`}
                  alt={studentData.full_name}
                />
                <AvatarFallback>
                  {studentData.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {studentData.full_name}
                </CardTitle>
                <CardDescription>
                  Grade Level: {studentData.grade_level || "N/A"}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Overall Progress</h3>
                <Progress
                  value={calculateOverallProgress()}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  {calculateOverallProgress()}% of assignments completed
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Average Grade
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {averageGrade}%
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Total Assignments
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {progressData.all.length}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                        <BarChartIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Subjects</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {progressData.subjects.length}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assignments">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Assignments</h3>
                <div className="space-y-2">
                  {progressData.recent.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <h4 className="font-semibold">
                            {assignment.file_name}
                          </h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            {new Date(
                              assignment.analyzed_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              assignment.score >= 70 ? "default" : "secondary"
                            }
                          >
                            {assignment.score}%
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.subject}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                {/* Grade Trends Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData.grades}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#8884d8"
                            name="Average Grade"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={progressData.subjects}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="average"
                            fill="#82ca9d"
                            name="Average Score"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
