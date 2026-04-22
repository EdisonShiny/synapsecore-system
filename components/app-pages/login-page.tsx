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
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-synapse-border bg-white/80 p-8 shadow-soft backdrop-blur md:p-10">
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-meta font-semibold uppercase tracking-[0.08em] text-synapse-primary">
            AI workflow automation
          </div>
          <h1 className="mt-5 max-w-xl text-[42px] font-semibold leading-[1.05] text-synapse-text">
            Clear coordination between HQ and branch offices.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-synapse-muted">
            SynapseCore turns scattered reports, forms, and branch updates into a guided workflow:
            analyze, plan, validate, approve, execute, and report.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              { title: "Messy input", description: "Capture unstructured updates and convert them into projects." },
              { title: "AI reasoning", description: "Generate plans, validate risk, and recommend the next step." },
              { title: "Stateful flow", description: "Track approvals, execution progress, and reporting in one place." }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4 shadow-sm">
                <p className="text-card-title text-synapse-text">{item.title}</p>
                <p className="mt-2 text-body text-synapse-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
        <form
          className="grid gap-5 rounded-[28px] border border-synapse-border bg-synapse-card p-8 shadow-soft"
          onSubmit={handleSubmit}
        >
          <div>
            <h2 className="text-section-title text-synapse-text">Sign in to the demo</h2>
            <p className="mt-2 text-body text-synapse-muted">
              Use a role-based account to test the full workflow from request intake to reporting.
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
          <div className="rounded-2xl border border-synapse-border bg-synapse-elevated p-4 text-meta text-synapse-muted">
            Use `hq@synapsecore.local` for HQ or one of the branch emails for branch testing.
          </div>
        </form>
      </div>
    </div>
  );
}
