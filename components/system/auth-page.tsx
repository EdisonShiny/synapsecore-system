"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, PrimaryButton, SecondaryButton, SelectField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { writeStoredSession, type DemoSession } from "@/src/client/session";
import { TabsShell } from "@/components/ui/feedback";
import type { CreateOfficeInput, OfficeRole } from "@/types/system";

const roleOptions: OfficeRole[] = ["HQ", "Branch Office"];

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"Sign In" | "Sign Up">("Sign In");
  const [authStatus, setAuthStatus] = useState<{ hqExists: boolean; accountCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "",
    role: "Branch Office" as OfficeRole
  });
  const [signupForm, setSignupForm] = useState<CreateOfficeInput>({
    officeName: "",
    role: "Branch Office",
    location: "",
    address: "",
    email: "",
    personInChargeName: "",
    position: "",
    contactNumber: ""
  });

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const data = await apiRequest<{ hqExists: boolean; accountCount: number }>("/api/auth/status");
        if (active) {
          setAuthStatus(data);
        }
      } catch {
        if (active) {
          setAuthStatus({ hqExists: false, accountCount: 0 });
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function completeAuth(session: DemoSession) {
    writeStoredSession(session);
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<DemoSession>("/api/auth/login", {
        method: "POST",
        json: loginForm
      });
      await completeAuth(session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<DemoSession>("/api/auth/signup", {
        method: "POST",
        json: signupForm
      });
      await completeAuth(session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-synapse-page p-4">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-meta uppercase tracking-[0.12em] text-synapse-secondary">Internal system access</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight text-synapse-text">Sign in or create an office account</h1>
            <p className="mt-3 text-body text-synapse-muted">
              Configure the office profile first. The system supports one HQ account and any number of Branch Office accounts.
            </p>
          </div>
          {authStatus ? (
            <div className="rounded-[20px] border border-synapse-border bg-synapse-elevated px-4 py-3 text-body text-synapse-muted">
              <div>{authStatus.accountCount} registered account{authStatus.accountCount === 1 ? "" : "s"}</div>
              <div>{authStatus.hqExists ? "HQ account already exists" : "HQ account not registered yet"}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <TabsShell tabs={["Sign In", "Sign Up"]} activeTab={mode} onChange={(tab) => setMode(tab as typeof mode)} />
        </div>

        {mode === "Sign In" ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSignIn}>
            <FormField
              label="Email"
              type="email"
              required
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
            />
            <SelectField
              label="Role"
              value={loginForm.role}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  role: event.target.value as OfficeRole
                }))
              }
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </SelectField>
            {error ? <p className="text-body text-synapse-error">{error}</p> : null}
            <PrimaryButton loading={loading} type="submit">
              Sign In
            </PrimaryButton>
          </form>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSignUp}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Company / Office Name"
                required
                value={signupForm.officeName}
                onChange={(event) => setSignupForm((current) => ({ ...current, officeName: event.target.value }))}
              />
              <SelectField
                label="Role"
                value={signupForm.role}
                onChange={(event) =>
                  setSignupForm((current) => ({
                    ...current,
                    role: event.target.value as OfficeRole
                  }))
                }
                hint={authStatus?.hqExists ? "HQ registration will be rejected because an HQ already exists." : undefined}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </SelectField>
            </div>
            <FormField
              label="Location"
              required
              placeholder="Kuala Lumpur, Malaysia"
              value={signupForm.location}
              onChange={(event) => setSignupForm((current) => ({ ...current, location: event.target.value }))}
            />
            <FormField
              label="Address"
              required
              value={signupForm.address}
              onChange={(event) => setSignupForm((current) => ({ ...current, address: event.target.value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Email"
                required
                type="email"
                value={signupForm.email}
                onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
              />
              <FormField
                label="Contact Number"
                value={signupForm.contactNumber}
                onChange={(event) => setSignupForm((current) => ({ ...current, contactNumber: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Person in Charge Name"
                required
                value={signupForm.personInChargeName}
                onChange={(event) =>
                  setSignupForm((current) => ({
                    ...current,
                    personInChargeName: event.target.value
                  }))
                }
              />
              <FormField
                label="Position / Responsibility Display"
                required
                value={signupForm.position}
                onChange={(event) => setSignupForm((current) => ({ ...current, position: event.target.value }))}
              />
            </div>
            {error ? <p className="text-body text-synapse-error">{error}</p> : null}
            <div className="flex flex-col gap-3 md:flex-row">
              <PrimaryButton loading={loading} type="submit" className="flex-1">
                Sign Up
              </PrimaryButton>
              <SecondaryButton type="button" className="flex-1" onClick={() => setMode("Sign In")}>
                Switch to Sign In
              </SecondaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
