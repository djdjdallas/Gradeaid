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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrades, setSelectedGrades] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState(null);

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

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = filteredGrades.map((grade) => grade.id);
      setSelectedGrades(new Set(allIds));
    } else {
      setSelectedGrades(new Set());
    }
  };

  const handleSelectGrade = (gradeId, checked) => {
    const newSelected = new Set(selectedGrades);
    if (checked) {
      newSelected.add(gradeId);
    } else {
      newSelected.delete(gradeId);
    }
    setSelectedGrades(newSelected);
  };

  const handleDelete = async () => {
    try {
      const idsToDelete = gradeToDelete
        ? [gradeToDelete]
        : Array.from(selectedGrades);

      const { error } = await supabase
        .from("paper_analyses")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      // Update local state
      setGrades(grades.filter((grade) => !idsToDelete.includes(grade.id)));
      setSelectedGrades(new Set());

      toast.success(
        `Successfully deleted ${idsToDelete.length} grade${
          idsToDelete.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete grades", {
        description: error.message,
      });
    } finally {
      setDeleteDialogOpen(false);
      setGradeToDelete(null);
    }
  };

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
            <div className="flex items-center gap-4">
              <CardTitle>Student Grades</CardTitle>
              {selectedGrades.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedGrades.size})
                </Button>
              )}
            </div>
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
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredGrades.length > 0 &&
                      filteredGrades.every((grade) =>
                        selectedGrades.has(grade.id)
                      )
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedGrades.has(grade.id)}
                      onCheckedChange={(checked) =>
                        handleSelectGrade(grade.id, checked)
                      }
                    />
                  </TableCell>
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
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setGradeToDelete(grade.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {gradeToDelete
                ? "Are you sure you want to delete this grade? This action cannot be undone."
                : `Are you sure you want to delete ${selectedGrades.size} selected grades? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setGradeToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
