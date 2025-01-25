import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    averageGrade: "N/A",
    assignmentsGraded: 0,
    timeSaved: 0,
    recentAssignments: [],
    students: [],
    gradeDistribution: [],
    gradeOverview: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData?.user?.id) {
        throw new Error("No authenticated user found");
      }

      const userId = authData.user.id;

      // Get teacher data
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id, full_name")
        .eq("user_id", userId)
        .single();

      if (teacherError) {
        console.error("Teacher fetch error details:", teacherError);
        if (teacherError.code === "PGRST116") {
          throw new Error("No teacher record found for the current user");
        }
        throw new Error(
          `Failed to fetch teacher data: ${teacherError.message}`
        );
      }

      if (!teacherData?.id) {
        throw new Error("No teacher record found");
      }

      const teacherId = teacherData.id;

      // Fetch students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, grade_level")
        .eq("teacher_id", teacherId);

      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }

      // Fetch paper analyses with student details
      const { data: papers, error: papersError } = await supabase
        .from("paper_analyses")
        .select(
          `
          id,
          subject,
          score,
          feedback,
          file_name,
          created_at,
          analyzed_at,
          student_id,
          students (
            full_name
          )
        `
        )
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });

      if (papersError) {
        throw new Error(
          `Failed to fetch paper analyses: ${papersError.message}`
        );
      }

      const totalStudents = students?.length || 0;
      const gradedPapers = (papers || []).filter(
        (paper) => paper.score != null
      );

      // Calculate statistics
      const averageGrade = calculateAverageGrade(gradedPapers);
      const timeSaved = calculateTimeSaved(gradedPapers);
      const gradeDistribution = calculateGradeDistribution(gradedPapers);
      const gradeOverview = calculateGradeOverview(gradedPapers);
      const studentPerformance = calculateStudentPerformance(
        students || [],
        gradedPapers
      );

      setDashboardData({
        totalStudents,
        averageGrade,
        assignmentsGraded: gradedPapers.length,
        timeSaved,
        recentAssignments: formatRecentAssignments(papers || []),
        students: studentPerformance,
        gradeDistribution,
        gradeOverview,
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", {
        message: error.message,
        stack: error.stack,
        details: error,
      });
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  return { dashboardData, loading, error, refetch: fetchDashboardData };
}

function calculateTimeSaved(papers) {
  return (papers?.length || 0) * 0.5;
}

function calculateAverageGrade(papers) {
  if (!papers?.length) return "N/A";

  const totalScore = papers.reduce((sum, paper) => sum + paper.score, 0);

  const averagePercentage = totalScore / papers.length;
  return calculateLetterGrade(averagePercentage);
}

function formatRecentAssignments(papers) {
  if (!papers?.length) return [];

  return papers.slice(0, 10).map((paper) => ({
    id: paper.id,
    name: paper.file_name,
    subject: paper.subject,
    studentName: paper.students?.full_name || "Unknown Student",
    grade: paper.score != null ? `${paper.score}%` : "Not graded",
    created_at: new Date(paper.created_at).toLocaleDateString(),
  }));
}

function calculateStudentPerformance(students, papers) {
  if (!students?.length || !papers?.length) return [];

  const studentGrades = {};

  // Initialize student records
  students.forEach((student) => {
    studentGrades[student.id] = {
      name: student.full_name,
      totalScore: 0,
      paperCount: 0,
    };
  });

  // Calculate grades
  papers.forEach((paper) => {
    if (
      paper.score != null &&
      paper.student_id &&
      studentGrades[paper.student_id]
    ) {
      studentGrades[paper.student_id].totalScore += paper.score;
      studentGrades[paper.student_id].paperCount++;
    }
  });

  return Object.values(studentGrades)
    .filter((student) => student.paperCount > 0)
    .map((student) => ({
      name: student.name,
      grade: calculateLetterGrade(student.totalScore / student.paperCount),
      assignmentCount: student.paperCount,
    }))
    .sort((a, b) => gradeToNumber(b.grade) - gradeToNumber(a.grade))
    .slice(0, 5);
}

function calculateGradeDistribution(papers) {
  if (!papers?.length) return [];

  const distribution = {
    A: 0,
    "A-": 0,
    "B+": 0,
    B: 0,
    "B-": 0,
    "C+": 0,
    C: 0,
    "C-": 0,
    "D+": 0,
    D: 0,
    F: 0,
  };

  papers.forEach((paper) => {
    if (paper.score != null) {
      const letterGrade = calculateLetterGrade(paper.score);
      distribution[letterGrade]++;
    }
  });

  return Object.entries(distribution)
    .map(([grade, count]) => ({ grade, students: count }))
    .filter((item) => item.students > 0);
}

function calculateGradeOverview(papers) {
  if (!papers?.length) return [];

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const overview = {};

  papers.forEach((paper) => {
    if (paper.score != null) {
      const date = new Date(paper.created_at);
      const month = months[date.getMonth()];

      if (!overview[month]) {
        overview[month] = { total: 0, count: 0 };
      }

      overview[month].total += paper.score;
      overview[month].count++;
    }
  });

  return Object.entries(overview)
    .map(([month, data]) => ({
      month,
      average: Math.round(data.total / data.count),
    }))
    .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
}

function calculateLetterGrade(percentage) {
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  return "F";
}

function gradeToNumber(grade) {
  const grades = {
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    F: 0.0,
  };
  return grades[grade] || 0;
}
