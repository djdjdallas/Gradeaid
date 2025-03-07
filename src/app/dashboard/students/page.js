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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Trash2,
  Edit,
  ChartLine,
  FileUp,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Papa from "papaparse";
export default function StudentsPage() {
  // State declarations for managing component data and UI
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    grade_level: "",
  });

  // Initialize data when component mounts
  useEffect(() => {
    initializeTeacherAndStudents();
  }, []);

  // Main initialization function to fetch teacher and student data
  async function initializeTeacherAndStudents() {
    try {
      setLoading(true);
      console.log("Starting initialization...");

      // Get authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        throw new Error(`Authentication failed: ${userError.message}`);
      }

      if (!user) {
        throw new Error("No authenticated user found");
      }

      console.log("Authenticated user:", user.id);

      // Get teacher profile with detailed error logging
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select(
          `
          id,
          user_id,
          full_name,
          email
        `
        )
        .eq("user_id", user.id)
        .single();

      if (teacherError) {
        console.error("Teacher fetch error:", {
          error: teacherError,
          code: teacherError.code,
          message: teacherError.message,
          details: teacherError.details,
          hint: teacherError.hint,
        });
        throw new Error(
          `Failed to fetch teacher profile: ${teacherError.message}`
        );
      }

      // Create teacher profile if it doesn't exist
      if (!teacherData) {
        const { data: newTeacher, error: createError } = await supabase
          .from("teachers")
          .insert([
            {
              user_id: user.id,
              full_name: user.email?.split("@")[0] || "New Teacher",
              email: user.email,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Teacher creation error:", createError);
          throw new Error(
            `Failed to create teacher profile: ${createError.message}`
          );
        }

        console.log("Created new teacher profile:", newTeacher);
        setTeacherProfile(newTeacher);
        teacherData = newTeacher;
      } else {
        console.log("Found existing teacher profile:", teacherData);
        setTeacherProfile(teacherData);
      }

      // Fetch students for this teacher
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          `
          id,
          full_name,
          grade_level,
          created_at
        `
        )
        .eq("teacher_id", teacherData.id)
        .order("full_name");

      if (studentsError) {
        console.error("Students fetch error:", {
          error: studentsError,
          code: studentsError.code,
          message: studentsError.message,
        });
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }

      console.log("Fetched students:", studentsData?.length || 0);
      setStudents(studentsData || []);
    } catch (error) {
      console.error("Initialization error:", {
        error,
        message: error.message,
        stack: error.stack,
      });
      toast.error("Failed to load data", {
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle student creation and updates
  const handleAddEditStudent = async (e) => {
    e.preventDefault();
    if (!teacherProfile) {
      toast.error("Teacher profile not found");
      return;
    }

    try {
      const studentData = {
        full_name: studentForm.full_name,
        grade_level: studentForm.grade_level,
        teacher_id: teacherProfile.id,
      };

      console.log("Saving student data:", studentData);

      if (currentStudent) {
        // Update existing student
        const { data, error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", currentStudent.id)
          .select();

        if (error) throw error;
        console.log("Updated student:", data);
        setStudents(
          students.map((s) => (s.id === currentStudent.id ? data[0] : s))
        );
        toast.success("Student updated successfully");
      } else {
        // Create new student
        const { data, error } = await supabase
          .from("students")
          .insert(studentData)
          .select();

        if (error) throw error;
        console.log("Added student:", data);
        setStudents([...students, data[0]]);
        toast.success("Student added successfully");
      }

      resetForm();
      setIsAddEditModalOpen(false);
      await initializeTeacherAndStudents(); // Refresh the list
    } catch (error) {
      console.error("Save error:", {
        error,
        message: error.message,
        details: error.details,
      });
      toast.error("Failed to save student", {
        description: error.message,
      });
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", currentStudent.id);

      if (error) throw error;

      console.log("Deleted student:", currentStudent.id);
      setStudents(students.filter((s) => s.id !== currentStudent.id));
      toast.success("Student deleted successfully");
      setIsDeleteModalOpen(false);

      await initializeTeacherAndStudents(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete student", {
        description: error.message,
      });
    }
  };

  // Reset form fields
  const resetForm = () => {
    setStudentForm({
      full_name: "",
      grade_level: "",
    });
    setCurrentStudent(null);
  };

  // Modal control functions
  const openAddEditModal = (student = null) => {
    if (student) {
      setCurrentStudent(student);
      setStudentForm({
        full_name: student.full_name,
        grade_level: student.grade_level || "",
      });
    } else {
      resetForm();
    }
    setIsAddEditModalOpen(true);
  };

  const openDeleteModal = (student) => {
    setCurrentStudent(student);
    setIsDeleteModalOpen(true);
  };

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  const downloadTemplate = () => {
    const csvContent = "full_name,grade_level\nJohn Doe,9\nJane Smith,10";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "text/csv") {
      toast.error("Please upload a CSV file");
      return;
    }
    setImportFile(file);
  };
  const handleImportStudents = async () => {
    if (!importFile || !teacherProfile) return;

    try {
      setImporting(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const csvData = event.target.result;
        console.log("CSV Data:", csvData); // Debug log

        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            console.log("Parse results:", results); // Debug log

            if (results.errors.length > 0) {
              console.error("CSV parsing errors:", results.errors); // Debug log
              throw new Error(
                `Error parsing CSV file: ${results.errors
                  .map((e) => e.message)
                  .join(", ")}`
              );
            }

            if (!results.data || results.data.length === 0) {
              throw new Error("No data found in CSV file");
            }

            // Validate CSV structure
            const requiredColumns = ["full_name", "grade_level"];
            const headers = Object.keys(results.data[0]);
            const missingColumns = requiredColumns.filter(
              (col) => !headers.includes(col)
            );

            if (missingColumns.length > 0) {
              throw new Error(
                `Missing required columns: ${missingColumns.join(", ")}`
              );
            }

            const students = results.data
              .map((row) => {
                const student = {
                  full_name: row.full_name?.trim(),
                  grade_level: row.grade_level?.trim(),
                  teacher_id: teacherProfile.id,
                };
                console.log("Processed student:", student); // Debug log
                return student;
              })
              .filter((student) => student.full_name);

            if (students.length === 0) {
              throw new Error("No valid student data found in CSV");
            }

            const { data, error } = await supabase
              .from("students")
              .insert(students)
              .select();

            if (error) throw error;

            toast.success(`Successfully imported ${data.length} students`);
            setIsImportModalOpen(false);
            setImportFile(null);
            await initializeTeacherAndStudents();
          },
          error: (error) => {
            console.error("Papa Parse error:", error); // Debug log
            throw new Error(`CSV parsing error: ${error}`);
          },
        });
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error); // Debug log
        throw new Error("Error reading file");
      };

      reader.readAsText(importFile);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import students", {
        description:
          error.message || "Please ensure your CSV file is properly formatted",
      });
    } finally {
      setImporting(false);
    }
  };

  // Main component render
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Students</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={() => openAddEditModal()}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* Student List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="3" className="text-center">
                    No students added yet
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/students/${student.id}/progress`}
                        className="hover:underline text-primary font-medium"
                      >
                        {student.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{student.grade_level || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddEditModal(student)}
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/students/${student.id}/progress`}
                          >
                            <ChartLine className="h-4 w-4 mr-2" /> Progress
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(student)}
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

      {/* Add/Edit Student Modal */}
      <Dialog
        open={isAddEditModalOpen}
        onOpenChange={(open) => {
          setIsAddEditModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEditStudent} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={studentForm.full_name}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    full_name: e.target.value,
                  })
                }
                required
                placeholder="Enter student's full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Input
                value={studentForm.grade_level}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    grade_level: e.target.value,
                  })
                }
                placeholder="Enter grade level"
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {currentStudent ? "Update Student" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentStudent?.full_name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStudent}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Import Students Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
            <DialogDescription>
              Upload a CSV file with student information.
              <Button
                variant="link"
                className="px-0 text-primary"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              <p className="text-sm text-muted-foreground">
                File should contain columns: full_name, grade_level
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportStudents}
              disabled={!importFile || importing}
            >
              {importing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full" />
                  Importing...
                </>
              ) : (
                "Import Students"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
