// hooks/use-study-guide-form.js
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_FORM_STATE = {
  gradeLevel: "",
  subject: "",
  topic: "",
  learningStyle: "visual", // visual, auditory, kinesthetic, reading/writing
  focusAreas: [],
  preparationTimeWeeks: 4,
  includeExamples: true,
  visualAids: true,
  difficultyLevel: "medium",
  specialNeeds: "",
};

// Questions to be asked in sequence
const FORM_SEQUENCE = [
  {
    step: 1,
    title: "Basic Information",
    fields: ["gradeLevel", "subject", "topic"],
    description:
      "Let's start with the fundamental information about your students and the subject matter.",
  },
  {
    step: 2,
    title: "Learning Preferences",
    fields: ["learningStyle", "specialNeeds", "visualAids"],
    description: "Help us understand how your students learn best.",
  },
  {
    step: 3,
    title: "Content Focus",
    fields: ["focusAreas", "difficultyLevel", "includeExamples"],
    description:
      "Tell us what areas need special attention and how to present the material.",
  },
  {
    step: 4,
    title: "Time and Planning",
    fields: ["preparationTimeWeeks"],
    description: "Let's plan the study schedule.",
  },
];

// Learning style options with descriptions
const LEARNING_STYLES = [
  {
    value: "visual",
    label: "Visual",
    description:
      "Learns best through images, diagrams, and spatial understanding",
  },
  {
    value: "auditory",
    label: "Auditory",
    description: "Prefers learning through listening and discussion",
  },
  {
    value: "kinesthetic",
    label: "Kinesthetic",
    description: "Learns through hands-on activities and physical engagement",
  },
  {
    value: "reading",
    label: "Reading/Writing",
    description: "Prefers text-based information and note-taking",
  },
];

export function useStudyGuideForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getCurrentFields = () => {
    return FORM_SEQUENCE.find((seq) => seq.step === currentStep);
  };

  const validateCurrentStep = () => {
    const currentFields = getCurrentFields().fields;
    const missingFields = currentFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, FORM_SEQUENCE.length));
      setError(null);
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM_STATE);
    setCurrentStep(1);
    setError(null);
  };

  const isLastStep = () => currentStep === FORM_SEQUENCE.length;

  const generateStudyGuide = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      const response = await fetch("/api/generate-study-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate study guide");
      }

      return await response.json();
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    formData,
    loading,
    error,
    FORM_SEQUENCE,
    LEARNING_STYLES,
    updateField,
    nextStep,
    previousStep,
    resetForm,
    isLastStep,
    generateStudyGuide,
    getCurrentFields,
  };
}
