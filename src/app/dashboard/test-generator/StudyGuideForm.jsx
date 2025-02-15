import React from "react";
import { useStudyGuideForm } from "@/hooks/use-study-guide-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Book, ListChecks, Clock } from "lucide-react";

export function StudyGuideForm({ onComplete }) {
  const {
    currentStep,
    formData,
    loading,
    error,
    FORM_SEQUENCE,
    LEARNING_STYLES,
    updateField,
    nextStep,
    previousStep,
    isLastStep,
    generateStudyGuide,
    getCurrentFields,
  } = useStudyGuideForm();

  const handleSubmit = async () => {
    try {
      const result = await generateStudyGuide();
      onComplete(result);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const renderField = (field) => {
    switch (field) {
      case "gradeLevel":
        return (
          <div className="space-y-2">
            <Label>Grade Level</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={formData.gradeLevel}
              onChange={(e) => updateField("gradeLevel", e.target.value)}
              placeholder="Enter grade level (1-12)"
            />
          </div>
        );

      case "subject":
        return (
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select
              value={formData.subject}
              onValueChange={(value) => updateField("subject", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Mathematics",
                  "Science",
                  "English",
                  "History",
                  "Geography",
                ].map((subject) => (
                  <SelectItem key={subject} value={subject.toLowerCase()}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "topic":
        return (
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              value={formData.topic}
              onChange={(e) => updateField("topic", e.target.value)}
              placeholder="Enter the specific topic"
              required
            />
          </div>
        );

      case "learningStyle":
        return (
          <div className="space-y-2">
            <Label>Primary Learning Style</Label>
            <RadioGroup
              value={formData.learningStyle}
              onValueChange={(value) => updateField("learningStyle", value)}
            >
              {LEARNING_STYLES.map((style) => (
                <div
                  key={style.value}
                  className="flex items-start space-x-2 space-y-1"
                >
                  <RadioGroupItem value={style.value} id={style.value} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={style.value}>{style.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {style.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "focusAreas":
        return (
          <div className="space-y-2">
            <Label>Areas Needing Focus</Label>
            <div className="grid gap-2">
              {[
                "Fundamentals",
                "Problem Solving",
                "Critical Thinking",
                "Memory Work",
                "Applications",
              ].map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.focusAreas.includes(area)}
                    onCheckedChange={(checked) => {
                      const newAreas = checked
                        ? [...formData.focusAreas, area]
                        : formData.focusAreas.filter((a) => a !== area);
                      updateField("focusAreas", newAreas);
                    }}
                  />
                  <Label>{area}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "preparationTimeWeeks":
        return (
          <div className="space-y-4">
            <Label>
              Preparation Time (Weeks): {formData.preparationTimeWeeks}
            </Label>
            <Slider
              value={[formData.preparationTimeWeeks]}
              onValueChange={(value) =>
                updateField("preparationTimeWeeks", value[0])
              }
              min={1}
              max={12}
              step={1}
            />
          </div>
        );

      case "specialNeeds":
        return (
          <div className="space-y-2">
            <Label>Special Learning Considerations (Optional)</Label>
            <Input
              value={formData.specialNeeds}
              onChange={(e) => updateField("specialNeeds", e.target.value)}
              placeholder="Enter any special learning needs or accommodations"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.topic?.trim()) {
        updateField("error", "Please fill in all required fields: topic");
        return false;
      }
    }
    updateField("error", null);
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  const currentFields = getCurrentFields();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex justify-between mb-6">
            {FORM_SEQUENCE.map((seq) => (
              <div
                key={seq.step}
                className={`flex items-center ${
                  seq.step === currentStep
                    ? "text-primary"
                    : seq.step < currentStep
                    ? "text-muted-foreground"
                    : "text-gray-300"
                }`}
              >
                {seq.step === 1 && <Book className="h-5 w-5" />}
                {seq.step === 2 && <ListChecks className="h-5 w-5" />}
                {seq.step === 3 && <Clock className="h-5 w-5" />}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{currentFields.title}</h3>
            <p className="text-sm text-muted-foreground">
              {currentFields.description}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {currentFields.fields.map((field) => (
              <div key={field}>{renderField(field)}</div>
            ))}
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {currentStep > 1 && (
              <Button variant="outline" onClick={previousStep}>
                Previous
              </Button>
            )}
            <Button
              className="ml-auto"
              onClick={isLastStep() ? handleSubmit : handleNext}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : isLastStep() ? (
                "Generate Study Guide"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
