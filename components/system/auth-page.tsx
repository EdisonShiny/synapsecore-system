"use client";

import { type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormField, PrimaryButton, SecondaryButton, SelectField } from "@/components";
import { apiRequest } from "@/src/client/api";
import { DEMO_LOGIN_OPTIONS, writeStoredSession, type DemoSession } from "@/src/client/session";
import { TabsShell } from "@/components/ui/feedback";
import type { CreateOfficeInput, DemoAccountSummary, OfficeRole, PublicAuthStatus } from "@/types/system";

const roleOptions: OfficeRole[] = ["HQ", "Branch Office"];

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"Sign In" | "Sign Up">("Sign In");
  const [authStatus, setAuthStatus] = useState<PublicAuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signinForm, setSigninForm] = useState<{ email: string; role: OfficeRole }>({
    email: "",
    role: "HQ"
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
        const data = await apiRequest<PublicAuthStatus>("/api/auth/status");
        if (active) {
          setAuthStatus(data);
        }
      } catch {
        if (active) {
          setAuthStatus({ hqExists: false, accountCount: 0, accounts: [] });
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
    router.push("/projects");
    router.refresh();
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

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<DemoSession>("/api/auth/login", {
        method: "POST",
        json: signinForm
      });
      await completeAuth(session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePresetSignIn(account: DemoAccountSummary) {
    setLoading(true);
    setError("");

    try {
      const session = await apiRequest<DemoSession>("/api/auth/login", {
        method: "POST",
        json: {
          email: account.email,
          role: account.role
        }
      });
      await completeAuth(session);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Preset sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  const presetAccounts = authStatus
    ? DEMO_LOGIN_OPTIONS
        .map((option) =>
          authStatus.accounts.find(
            (account) => account.email === option.email && account.role === option.role
          ) ?? authStatus.accounts.find((account) => account.role === option.role)
        )
        .filter((account): account is DemoAccountSummary => Boolean(account))
    : [];

  return (
    <div className="grid min-h-screen place-items-center bg-synapse-page p-4">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-[20px] border border-white/70 bg-slate-950 shadow-sm">
                <Image
                  src="/synapsecore-logo.png"
                  alt="SynapseCore logo"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-card-title text-synapse-text">SynapseCore</p>
                <p className="text-meta text-synapse-muted">HQ and branch workflow service</p>
              </div>
            </div>
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
          <div className="mt-6 grid gap-6">
            <div className="grid gap-3">
              <div>
                <h2 className="text-section-title text-synapse-text">Sign in</h2>
                <p className="mt-1 text-body text-synapse-muted">
                  Use a registered office email and role to enter the system.
                </p>
              </div>

              <form className="grid gap-4" onSubmit={handleSignIn}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Email"
                    required
                    type="email"
                    value={signinForm.email}
                    onChange={(event) =>
                      setSigninForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                  <SelectField
                    label="Role"
                    value={signinForm.role}
                    onChange={(event) =>
                      setSigninForm((current) => ({
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
                </div>
                <PrimaryButton loading={loading} type="submit">
                  Sign In
                </PrimaryButton>
              </form>

              {presetAccounts.length > 0 ? (
                <div className="grid gap-3 rounded-[22px] border border-synapse-border bg-synapse-elevated/70 p-4">
                  <div>
                    <p className="text-card-title text-synapse-text">Preset testing accounts</p>
                    <p className="mt-1 text-body text-synapse-muted">
                      Use these accounts to test the HQ and Branch Office views without creating a new account.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {presetAccounts.map((account) => (
                      <SecondaryButton
                        key={account.id}
                        type="button"
                        loading={loading}
                        onClick={() => handlePresetSignIn(account)}
                      >
                        Sign in as {account.role}
                      </SecondaryButton>
                    ))}
                  </div>
                  <div className="grid gap-2 text-meta text-synapse-muted">
                    {presetAccounts.map((account) => (
                      <p key={`${account.id}-email`}>
                        {account.role}: {account.email}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              {error ? <p className="text-body text-synapse-error">{error}</p> : null}
            </div>
          </div>
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
