"use client";

import { type FormEvent, useEffect, useState } from "react";
import { AppShell, DangerButton, FormField, PrimaryButton, SecondaryButton } from "@/components";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";
import { ModalDialog } from "@/components/ui/feedback";
import { PageSection } from "@/components/system/ui";
import type { OfficeAccount, SystemSettingsPayload } from "@/types/system";

type SettingsForm = {
  location: string;
  address: string;
  personInChargeName: string;
  position: string;
  email: string;
  contactNumber: string;
};

export function SettingsPage() {
  const { session, loading: sessionLoading, signOut, setSession } = useDemoSession();
  const [form, setForm] = useState<SettingsForm>({
    location: "",
    address: "",
    personInChargeName: "",
    position: "",
    email: "",
    contactNumber: ""
  });
  const [aiConfig, setAiConfig] = useState<SystemSettingsPayload["aiConfig"]>({
    apiUrl: "",
    apiKey: "",
    model: "nemo-super",
    enableWebSearch: true
  });
  const [databaseInfo, setDatabaseInfo] = useState<SystemSettingsPayload["database"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const [officeData, settingsData] = await Promise.all([
          apiRequest<{ office: OfficeAccount }>("/api/offices/me", { session }),
          apiRequest<SystemSettingsPayload>("/api/settings/system-config", { session })
        ]);

        if (active) {
          setForm({
            location: officeData.office.location,
            address: officeData.office.address,
            personInChargeName: officeData.office.personInChargeName,
            position: officeData.office.position,
            email: officeData.office.email,
            contactNumber: officeData.office.contactNumber
          });
          setAiConfig(settingsData.aiConfig);
          setDatabaseInfo(settingsData.database);
        }
      } catch (loadError) {
        if (active) {
          setFeedback(loadError instanceof Error ? loadError.message : "Failed to load settings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [session]);

  if (!session || sessionLoading) {
    return null;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;
    if (!currentSession) {
      return;
    }
    setSubmitting(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ office: OfficeAccount }>("/api/offices/me", {
        method: "PATCH",
        session: currentSession,
        json: form
      });
      setSession({
        token: currentSession.token,
        user: data.office
      });
      setFeedback("Settings updated successfully.");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Settings update failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveAiConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = session;

    if (!currentSession) {
      return;
    }

    setSubmitting(true);
    setFeedback("");

    try {
      const data = await apiRequest<SystemSettingsPayload>("/api/settings/system-config", {
        method: "PATCH",
        session: currentSession,
        json: aiConfig
      });
      setAiConfig(data.aiConfig);
      setDatabaseInfo(data.database);
      setFeedback("System AI configuration updated successfully.");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "AI configuration update failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClearData() {
    const currentSession = session;
    if (!currentSession) {
      return;
    }
    setSubmitting(true);
    setFeedback("");

    try {
      await apiRequest("/api/settings/clear-data", {
        method: "POST",
        session: currentSession
      });
      setConfirmClearOpen(false);
      setFeedback(session.user.role === "HQ" ? "System workflow data cleared." : "Branch workflow data cleared.");
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : "Failed to clear data.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      session={session}
      signOut={signOut}
      title="Settings"
      description={
        session.user.role === "HQ"
          ? "Update HQ profile details and manage system-level workflow data."
          : "Update branch profile details and clear branch-owned workflow data."
      }
    >
      <PageSection
        title={session.user.role === "HQ" ? "HQ settings" : "Branch settings"}
        description="Edit office location, responsible contact, and primary contact information."
      >
        {loading ? (
          <p className="text-body text-synapse-muted">Loading office profile...</p>
        ) : (
          <form className="grid gap-4" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Location" required value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              <FormField label="Email" required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <FormField label="Address" required value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                label="Person in charge"
                required
                value={form.personInChargeName}
                onChange={(event) => setForm((current) => ({ ...current, personInChargeName: event.target.value }))}
              />
              <FormField
                label="Position / responsibility"
                required
                value={form.position}
                onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
              />
              <FormField
                label="Contact number"
                value={form.contactNumber}
                onChange={(event) => setForm((current) => ({ ...current, contactNumber: event.target.value }))}
              />
            </div>
            <PrimaryButton loading={submitting} type="submit">
              Save settings
            </PrimaryButton>
          </form>
        )}
        {feedback ? <p className={`text-body ${feedback.includes("failed") || feedback.includes("Failed") ? "text-synapse-error" : "text-synapse-secondary"}`}>{feedback}</p> : null}
      </PageSection>

      {session.user.role === "HQ" ? (
        <PageSection
          title="AI configuration"
          description="Store the live AI API link and key here. Workflow, request, and phase AI stages now use these values for real ILMU calls, with a local fallback if the live call fails."
        >
          {loading ? (
            <p className="text-body text-synapse-muted">Loading AI configuration...</p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSaveAiConfig}>
              <FormField
                label="AI API link"
                value={aiConfig.apiUrl}
                onChange={(event) =>
                  setAiConfig((current) => ({ ...current, apiUrl: event.target.value }))
                }
                placeholder="https://api.ilmu.ai/v1"
                hint="Use the ILMU OpenAI-compatible base URL. The app will call /chat/completions under this base."
              />
              <FormField
                label="AI API key"
                type="password"
                value={aiConfig.apiKey}
                onChange={(event) =>
                  setAiConfig((current) => ({ ...current, apiKey: event.target.value }))
                }
                placeholder="Enter the server-side API key"
                hint="The live client uses this saved key when calling ILMU."
              />
              <FormField
                label="AI model"
                value={aiConfig.model}
                onChange={(event) =>
                  setAiConfig((current) => ({ ...current, model: event.target.value }))
                }
                placeholder="nemo-super"
                hint="Use the exact ILMU model name your account is allowed to access."
              />
              <label className="flex items-center gap-3 text-body text-synapse-text">
                <input
                  type="checkbox"
                  checked={aiConfig.enableWebSearch}
                  onChange={(event) =>
                    setAiConfig((current) => ({ ...current, enableWebSearch: event.target.checked }))
                  }
                />
                Enable web search tool for AI calls
              </label>
              {databaseInfo ? (
                <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4 text-body text-synapse-muted">
                  <p className="font-semibold text-synapse-text">Current persistent database</p>
                  <p className="mt-2">Engine: {databaseInfo.engine}</p>
                  <p className="mt-1 break-all">Path: {databaseInfo.path}</p>
                </div>
              ) : null}
              <PrimaryButton loading={submitting} type="submit">
                Save AI configuration
              </PrimaryButton>
            </form>
          )}
        </PageSection>
      ) : null}

      <PageSection
        title={session.user.role === "HQ" ? "System-level data controls" : "Branch data controls"}
        description={
          session.user.role === "HQ"
            ? "Clear all workflow records while keeping registered office accounts intact."
            : "Clear branch-owned projects, insights, and issue threads while keeping the branch account."
        }
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-card-title text-red-800">{session.user.role === "HQ" ? "Clear system workflow data" : "Clear branch workflow data"}</p>
          <p className="mt-2 text-body text-red-700">
            This action removes active workflow records and should only be used when the office explicitly wants a clean operating slate.
          </p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <DangerButton className="md:w-auto" onClick={() => setConfirmClearOpen(true)}>
              Clear data
            </DangerButton>
            <SecondaryButton className="md:w-auto" onClick={signOut}>
              Sign out
            </SecondaryButton>
          </div>
        </div>
      </PageSection>

      <ModalDialog open={confirmClearOpen} title="Confirm data clearing" onClose={() => setConfirmClearOpen(false)}>
        <div className="grid gap-4">
          <p className="text-body text-synapse-muted">
            Confirm this action to clear the current workflow data set for {session.user.role === "HQ" ? "the whole system" : "this branch"}.
          </p>
          <div className="flex flex-col gap-3 md:flex-row">
            <DangerButton className="flex-1" loading={submitting} onClick={handleClearData}>
              Confirm clear data
            </DangerButton>
            <SecondaryButton className="flex-1" onClick={() => setConfirmClearOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      </ModalDialog>
    </AppShell>
  );
}
