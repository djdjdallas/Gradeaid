// hooks/use-test-generator.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useTestGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedTest, setGeneratedTest] = useState(null);

  const generateTest = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // Get fresh session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("Please sign in to generate tests");
      }

      // Make API call
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          user_id: sessionData.session.user.id,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || "Failed to generate test");
      }

      const data = await response.json();

      // Validate response data
      if (!data.success) {
        console.error("API Success False:", data);
        throw new Error(data.error || "Failed to generate test");
      }

      if (!data.content) {
        console.error("Missing Content in Response:", data);
        throw new Error("Generated test content is missing");
      }

      setGeneratedTest(data);
      return data;
    } catch (error) {
      console.error("Test generation error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const downloadTest = async (testId, format = "pdf") => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Please sign in to download tests");
      }

      const response = await fetch(
        `/api/generate-test/${testId}/download?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download test");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-${testId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Test downloaded successfully");
    } catch (error) {
      setError(error.message);
      toast.error("Failed to download test");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRecentTests = async (limit = 5) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Please sign in to view tests");
      }

      const { data, error } = await supabase
        .from("generated_tests")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Database query error:", error);
        throw error;
      }

      return data;
    } catch (error) {
      setError(error.message);
      console.error("Get recent tests error:", error);
      throw error;
    }
  };

  const deleteTest = async (testId) => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Please sign in to delete tests");
      }

      const { error } = await supabase
        .from("generated_tests")
        .delete()
        .eq("id", testId)
        .eq("user_id", sessionData.session.user.id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      toast.success("Test deleted successfully");
    } catch (error) {
      setError(error.message);
      toast.error("Failed to delete test");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generatedTest,
    generateTest,
    downloadTest,
    getRecentTests,
    deleteTest,
    setError,
  };
}
