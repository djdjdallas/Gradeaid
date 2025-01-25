"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    gradeDistribution: [
      { grade: "A", range: "90-100", count: 0 },
      { grade: "B", range: "80-89", count: 0 },
      { grade: "C", range: "70-79", count: 0 },
      { grade: "D", range: "60-69", count: 0 },
      { grade: "F", range: "0-59", count: 0 },
    ],
    performanceOverTime: [],
    topStudents: [],
    subjectPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      console.log("Starting analytics fetch...");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (teacherError) {
        console.error("Teacher fetch error:", teacherError);
        throw teacherError;
      }

      console.log("Teacher ID:", teacherData?.id);

      const { data: analysesData, error: analysesError } = await supabase
        .from("paper_analyses")
        .select(
          `
          id,
          score,
          subject,
          analyzed_at,
          student_id,
          students (
            id,
            full_name
          )
        `
        )
        .eq("teacher_id", teacherData.id);

      if (analysesError) {
        console.error("Analyses fetch error:", analysesError);
        throw analysesError;
      }

      console.log("Fetched analyses:", analysesData);

      const distribution = processGradeDistribution(analysesData);
      const performance = processPerformanceOverTime(analysesData);
      const subjectPerformance = processSubjectPerformance(analysesData);
      const topStudents = await processTopStudents(analysesData);

      setAnalytics({
        gradeDistribution: distribution,
        performanceOverTime: performance,
        topStudents,
        subjectPerformance,
      });
    } catch (error) {
      console.error("Analytics Fetch Error:", error);
      toast.error("Failed to Load Analytics", {
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  }

  function processGradeDistribution(analyses) {
    const distribution = [
      { grade: "A", range: "90-100", count: 0 },
      { grade: "B", range: "80-89", count: 0 },
      { grade: "C", range: "70-79", count: 0 },
      { grade: "D", range: "60-69", count: 0 },
      { grade: "F", range: "0-59", count: 0 },
    ];

    analyses?.forEach((analysis) => {
      const score = analysis.score;
      if (score >= 90) distribution[0].count++;
      else if (score >= 80) distribution[1].count++;
      else if (score >= 70) distribution[2].count++;
      else if (score >= 60) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  }

  function processPerformanceOverTime(analyses) {
    const performanceMap = {};

    analyses?.forEach((analysis) => {
      const date = new Date(analysis.analyzed_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!performanceMap[date]) {
        performanceMap[date] = { total: 0, count: 0 };
      }
      performanceMap[date].total += analysis.score;
      performanceMap[date].count++;
    });

    return Object.entries(performanceMap)
      .map(([date, data]) => ({
        date,
        average: Math.round(data.total / data.count),
      }))
      .sort((a, b) => {
        const parseDate = (dateStr) => {
          const [month, year] = dateStr.split(", ");
          return new Date(`${month} 1, ${year}`);
        };
        return parseDate(a.date) - parseDate(b.date);
      });
  }

  function processTopStudents(analyses) {
    const studentScores = {};

    analyses?.forEach((analysis) => {
      if (!analysis.students) return;

      const studentId = analysis.student_id;
      if (!studentScores[studentId]) {
        studentScores[studentId] = {
          name: analysis.students.full_name,
          totalScore: 0,
          gradeCount: 0,
        };
      }
      studentScores[studentId].totalScore += analysis.score;
      studentScores[studentId].gradeCount++;
    });

    return Object.values(studentScores)
      .map((student) => ({
        ...student,
        average: Math.round(student.totalScore / student.gradeCount),
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);
  }

  function processSubjectPerformance(analyses) {
    const subjectMap = {};

    analyses?.forEach((analysis) => {
      const subject = analysis.subject;
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, count: 0 };
      }
      subjectMap[subject].total += analysis.score;
      subjectMap[subject].count++;
    });

    return Object.entries(subjectMap)
      .map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.average - a.average);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>
              Distribution of grades across all assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Average grade trends by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="average" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>
              Students with highest average grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topStudents.length > 0 ? (
                analytics.topStudents.map((student, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{student.name}</p>
                    </div>
                    <div className="text-lg font-bold">{student.average}%</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  No student performance data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average grades by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
