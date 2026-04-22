"use client";

import { useState } from "react";
import { AppShell, FormField, PrimaryButton, SecondaryButton } from "@/components";
import { Panel, GuardedPageState } from "@/components/app-pages/ui";
import { apiRequest } from "@/src/client/api";
import { useDemoSession } from "@/src/client/use-demo-session";

export function SettingsPageClient() {
  const { session, loading, signOut } = useDemoSession();
  const [message, setMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!session) {
      return;
    }

    setResetting(true);
    setError("");
    setMessage("");

    try {
      await apiRequest<{ reset: boolean }>("/api/dev/reset", {
        method: "POST",
        session
      });
      setMessage("Demo data has been reset.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset data.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <AppShell pageTitle="Settings" role={session?.user.role ?? "HQ"} activeItem="Settings">
      <GuardedPageState loading={loading}>
        {session ? (
          <Panel title="Session" description="Manage the current demo session and test data.">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="User" value={session.user.name} readOnly />
              <FormField label="Role" value={session.user.role} readOnly />
              <FormField label="Email" value={session.user.email} readOnly />
              <FormField label="Token" value={session.token} readOnly />
            </div>
            {message ? <p className="text-body text-synapse-success">{message}</p> : null}
            {error ? <p className="text-body text-synapse-error">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <SecondaryButton onClick={signOut}>Sign out</SecondaryButton>
              {session.user.role === "HQ" ? (
                <PrimaryButton loading={resetting} onClick={handleReset}>
                  Reset demo data
                </PrimaryButton>
              ) : null}
            </div>
          </Panel>
        ) : null}
      </GuardedPageState>
    </AppShell>
  );
}
