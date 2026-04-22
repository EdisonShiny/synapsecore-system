"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FormField, PrimaryButton, SelectField } from "@/components";
import { apiRequest } from "@/src/client/api";
import {
  DEMO_LOGIN_OPTIONS,
  writeStoredSession,
  type DemoSession
} from "@/src/client/session";

export function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(DEMO_LOGIN_OPTIONS[0].email);
  const [role, setRole] = useState<(typeof DEMO_LOGIN_OPTIONS)[number]["role"]>(
    DEMO_LOGIN_OPTIONS[0].role
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<DemoSession>("/api/auth/login", {
        method: "POST",
        json: { email, role }
      });

      writeStoredSession(session);
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-synapse-page p-4">
      <form
        className="grid w-full max-w-md gap-5 rounded-2xl border border-synapse-border bg-synapse-card p-8 shadow-soft"
        onSubmit={handleSubmit}
      >
        <div>
          <h1 className="text-page-title text-synapse-text">SynapseCore System</h1>
          <p className="mt-2 text-body text-synapse-muted">
            Sign in with a demo account and use the live mock workflow.
          </p>
        </div>
        <SelectField
          label="Demo account"
          value={`${email}|${role}`}
          onChange={(event) => {
            const [nextEmail, nextRole] = event.target.value.split("|");
            setEmail(nextEmail);
            setRole(nextRole as typeof role);
          }}
        >
          {DEMO_LOGIN_OPTIONS.map((option) => (
            <option key={`${option.email}-${option.role}`} value={`${option.email}|${option.role}`}>
              {option.label} - {option.role}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <SelectField
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
        >
          <option value="Branch Office">Branch Office</option>
          <option value="HQ">HQ</option>
        </SelectField>
        {error ? <p className="text-body text-synapse-error">{error}</p> : null}
        <PrimaryButton loading={loading} type="submit">
          Sign in
        </PrimaryButton>
        <div className="rounded-xl border border-synapse-border bg-synapse-elevated p-4 text-meta text-synapse-muted">
          Use `hq@synapsecore.local` for HQ or one of the branch emails for branch testing.
        </div>
      </form>
    </div>
  );
}
