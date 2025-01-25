"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    fullName: "",
    email: "",
    subject: "",
    notifications: {
      emailNotifications: false,
      newSubmissionAlerts: false,
      gradingReminders: false,
    },
    grading: {
      useAI: true,
      requireManualReview: true,
      defaultFeedbackTemplate: "",
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user settings
      const { data: userSettings, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Set initial settings
      setSettings({
        fullName: profile.full_name || "",
        email: user.email,
        subject: profile.subject || "",
        notifications: {
          emailNotifications: userSettings?.email_notifications ?? false,
          newSubmissionAlerts: userSettings?.new_submission_alerts ?? false,
          gradingReminders: userSettings?.grading_reminders ?? false,
        },
        grading: {
          useAI: userSettings?.use_ai ?? true,
          requireManualReview: userSettings?.require_manual_review ?? true,
          defaultFeedbackTemplate:
            userSettings?.default_feedback_template || "",
        },
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings", {
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: settings.fullName,
          subject: settings.subject,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update or insert settings
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          email_notifications: settings.notifications.emailNotifications,
          new_submission_alerts: settings.notifications.newSubmissionAlerts,
          grading_reminders: settings.notifications.gradingReminders,
          use_ai: settings.grading.useAI,
          require_manual_review: settings.grading.requireManualReview,
          default_feedback_template: settings.grading.defaultFeedbackTemplate,
        });

      if (settingsError) throw settingsError;

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings", {
        description: error.message || "Please try again later",
      });
    } finally {
      setSaving(false);
    }
  }

  // Helper function to update nested settings
  const updateSettings = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-6">
        {/* Profile Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={settings.fullName}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={settings.email} disabled type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Primary Subject</Label>
              <Input
                id="subject"
                value={settings.subject}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder="Enter your primary teaching subject"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  updateSettings("notifications", "emailNotifications", checked)
                }
              />
            </div>

            {/* New Submission Alerts */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Submission Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when students submit new papers
                </p>
              </div>
              <Switch
                checked={settings.notifications.newSubmissionAlerts}
                onCheckedChange={(checked) =>
                  updateSettings(
                    "notifications",
                    "newSubmissionAlerts",
                    checked
                  )
                }
              />
            </div>

            {/* Grading Reminders */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Grading Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders for pending papers to grade
                </p>
              </div>
              <Switch
                checked={settings.notifications.gradingReminders}
                onCheckedChange={(checked) =>
                  updateSettings("notifications", "gradingReminders", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Grading Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Grading Settings</CardTitle>
            <CardDescription>
              Configure your grading preferences and AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Use AI Assistance */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Use AI Assistance</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI to help with grading papers
                </p>
              </div>
              <Switch
                checked={settings.grading.useAI}
                onCheckedChange={(checked) =>
                  updateSettings("grading", "useAI", checked)
                }
              />
            </div>

            {/* Require Manual Review */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Manual Review</Label>
                <p className="text-sm text-muted-foreground">
                  Review AI-generated grades before finalizing
                </p>
              </div>
              <Switch
                checked={settings.grading.requireManualReview}
                onCheckedChange={(checked) =>
                  updateSettings("grading", "requireManualReview", checked)
                }
              />
            </div>

            {/* Default Feedback Template */}
            <div className="space-y-2">
              <Label>Default Feedback Template</Label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your default feedback template..."
                value={settings.grading.defaultFeedbackTemplate}
                onChange={(e) =>
                  updateSettings(
                    "grading",
                    "defaultFeedbackTemplate",
                    e.target.value
                  )
                }
              />
              <p className="text-sm text-muted-foreground">
                Use {"{score}"}, {"{student_name}"}, and {"{feedback}"} as
                placeholders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
