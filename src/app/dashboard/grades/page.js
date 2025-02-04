"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, BarChart } from "lucide-react";
import { toast } from "sonner";

export default function GradesPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  async function fetchGrades() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (teacherError) throw teacherError;

      // First get all students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, grade_level")
        .eq("teacher_id", teacherData.id);

      if (studentsError) throw studentsError;

      // Then get all grades
      const { data: grades, error: gradesError } = await supabase
        .from("paper_analyses")
        .select(
          `
          id,
          score,
          subject,
          analyzed_at,
          student_id
        `
        )
        .eq("teacher_id", teacherData.id);

      if (gradesError) throw gradesError;

      // Process and combine the data
      const processedStudents = studentsData.map((student) => {
        const studentGrades = grades.filter(
          (grade) => grade.student_id === student.id
        );
        const averageScore =
          studentGrades.length > 0
            ? studentGrades.reduce((sum, grade) => sum + grade.score, 0) /
              studentGrades.length
            : 0;

        const subjectBreakdown = {};
        studentGrades.forEach((grade) => {
          if (!subjectBreakdown[grade.subject]) {
            subjectBreakdown[grade.subject] = [];
          }
          subjectBreakdown[grade.subject].push(grade.score);
        });

        const subjectAverages = Object.entries(subjectBreakdown).map(
          ([subject, scores]) => ({
            subject,
            average:
              scores.reduce((sum, score) => sum + score, 0) / scores.length,
          })
        );

        return {
          id: student.id,
          name: student.full_name,
          gradeLevel: student.grade_level,
          averageScore: Math.round(averageScore),
          assignmentCount: studentGrades.length,
          recentGrade:
            studentGrades.length > 0
              ? studentGrades.sort(
                  (a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at)
                )[0].score
              : null,
          subjectAverages,
          trend: calculateTrend(studentGrades),
        };
      });

      setStudents(processedStudents);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Failed to fetch grades", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  function calculateTrend(grades) {
    if (grades.length < 2) return "neutral";
    const sortedGrades = grades.sort(
      (a, b) => new Date(a.analyzed_at) - new Date(b.analyzed_at)
    );
    const recentGrades = sortedGrades.slice(-3);
    const firstGrade = recentGrades[0].score;
    const lastGrade = recentGrades[recentGrades.length - 1].score;
    return lastGrade > firstGrade
      ? "up"
      : lastGrade < firstGrade
      ? "down"
      : "neutral";
  }

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const filteredAndSortedStudents = [...students]
    .filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.gradeLevel?.toString().includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortConfig.key === "name") {
        return sortConfig.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return sortConfig.direction === "asc"
        ? a[sortConfig.key] - b[sortConfig.key]
        : b[sortConfig.key] - a[sortConfig.key];
    });

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold tracking-tight">Grades</h2>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Student Grade Overview</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Student Name {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("averageScore")}
                >
                  <div className="flex items-center gap-2">
                    Overall Average {getSortIcon("averageScore")}
                  </div>
                </TableHead>
                <TableHead>Recent Performance</TableHead>
                <TableHead>Subject Breakdown</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("assignmentCount")}
                >
                  <div className="flex items-center gap-2">
                    Assignments {getSortIcon("assignmentCount")}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div>
                      {student.name}
                      <div className="text-sm text-muted-foreground">
                        Grade {student.gradeLevel || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={getScoreColor(student.averageScore)}>
                    <div className="font-bold text-lg">
                      {student.averageScore}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {student.recentGrade && (
                        <>
                          <div className={getScoreColor(student.recentGrade)}>
                            {student.recentGrade}%
                          </div>
                          {student.trend === "up" && (
                            <div className="text-green-500">↑</div>
                          )}
                          {student.trend === "down" && (
                            <div className="text-red-500">↓</div>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {student.subjectAverages.map((subject) => (
                        <div
                          key={subject.subject}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm font-medium">
                            {subject.subject}:
                          </span>
                          <span className={getScoreColor(subject.average)}>
                            {Math.round(subject.average)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{student.assignmentCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // This would link to a detailed view
                        toast.info("View detailed performance", {
                          description: `Viewing ${student.name}'s detailed performance`,
                        });
                      }}
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredAndSortedStudents.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No students found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
