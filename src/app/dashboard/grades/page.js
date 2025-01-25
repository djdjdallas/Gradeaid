"use client";
import { useEffect, useState } from "react";
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
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

      // First get the teacher's ID
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (teacherError) throw teacherError;

      // Fetch paper analyses for this teacher
      const { data, error } = await supabase
        .from("paper_analyses")
        .select(
          `
          id,
          score,
          feedback,
          subject,
          file_name,
          analyzed_at,
          students (
            id,
            full_name
          )
        `
        )
        .eq("teacher_id", teacherData.id)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;
      console.log("Fetched grades:", data);
      setGrades(data || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Failed to fetch grades", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredGrades = grades.filter(
    (grade) =>
      grade.students?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      grade.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGradeColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">Loading...</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Student Grades</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search grades..."
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
                <TableHead>Student Name</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>{grade.students?.full_name}</TableCell>
                  <TableCell>{grade.file_name}</TableCell>
                  <TableCell>{grade.subject}</TableCell>
                  <TableCell className={getGradeColor(grade.score)}>
                    {grade.score}%
                  </TableCell>
                  <TableCell>
                    {new Date(grade.analyzed_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {grade.feedback}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.info("View Details", {
                          description: `Details for ${grade.students?.full_name}'s paper: ${grade.file_name}`,
                        });
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredGrades.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No grades found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
