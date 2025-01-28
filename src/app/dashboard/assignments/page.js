"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentsToDelete, setAssignmentsToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("User fetch error:", userError);
        throw userError;
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

      const { data, error } = await supabase
        .from("paper_analyses")
        .select(
          `
          id,
          subject,
          score,
          feedback,
          file_name,
          analyzed_at,
          grading_method,
          students (
            full_name
          )
        `
        )
        .eq("teacher_id", teacherData.id)
        .order("analyzed_at", { ascending: false });

      if (error) {
        console.error("Assignments fetch error:", error);
        throw error;
      }

      setAssignments(data || []);
    } catch (error) {
      console.error("Fetch error details:", {
        error,
        message: error.message,
        stack: error.stack,
      });
      toast.error("Failed to fetch assignments", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(assignments.map((a) => a.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      toast.error("Please select assignments to delete");
      return;
    }
    setAssignmentsToDelete([...selectedRows]);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSingle = (id) => {
    if (!id) {
      toast.error("Invalid assignment selected");
      return;
    }
    setAssignmentsToDelete([id]);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentsToDelete?.length) {
      toast.error("No assignments selected for deletion");
      return;
    }

    try {
      console.log("Starting delete operation:", {
        assignmentsToDelete,
        timestamp: new Date().toISOString(),
      });

      // First verify the assignments exist and are deletable
      const { data: existingAssignments, error: checkError } = await supabase
        .from("paper_analyses")
        .select("id")
        .in("id", assignmentsToDelete);

      if (checkError) {
        console.error("Error checking assignments:", {
          error: checkError,
          message: checkError.message,
          details: checkError.details,
        });
        throw new Error(`Failed to verify assignments: ${checkError.message}`);
      }

      if (!existingAssignments?.length) {
        throw new Error("No matching assignments found");
      }

      console.log("Verified assignments exist:", {
        found: existingAssignments.length,
        expected: assignmentsToDelete.length,
      });

      // Perform the deletion with explicit error handling
      const { error: deleteError } = await supabase
        .from("paper_analyses")
        .delete()
        .in("id", assignmentsToDelete);

      if (deleteError) {
        console.error("Delete operation error:", {
          error: deleteError,
          message: deleteError.message,
          details: deleteError.details,
          code: deleteError.code,
        });
        throw new Error(`Delete operation failed: ${deleteError.message}`);
      }

      console.log("Delete operation successful");

      toast.success(
        `Successfully deleted ${assignmentsToDelete.length} assignment(s)`
      );
      setSelectedRows(new Set());
      await fetchAssignments();
    } catch (error) {
      console.error("Delete error details:", {
        error,
        message: error.message,
        stack: error.stack,
        assignmentsToDelete,
        timestamp: new Date().toISOString(),
      });

      toast.error("Failed to delete assignments", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAssignmentsToDelete(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedRows.size})
            </Button>
          )}
          <Button onClick={() => router.push("/dashboard/paper-grader")}>
            <Plus className="mr-2 h-4 w-4" /> Grade New Assignment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Graded Papers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === assignments.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grading Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No assignments graded yet
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(assignment.id)}
                        onCheckedChange={() => handleSelectRow(assignment.id)}
                        aria-label={`Select ${assignment.file_name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {assignment.file_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.students?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>
                      <Badge className={getScoreColor(assignment.score)}>
                        {assignment.score}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assignment.grading_method === "accuracy_only"
                          ? "Math (Accuracy Only)"
                          : "Weighted Criteria"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.analyzed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast.info("View Details", {
                              description: `Details for ${assignment.file_name}`,
                            });
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteSingle(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {assignmentsToDelete?.length}{" "}
              assignment(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
