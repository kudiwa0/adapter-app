"use client";

import { Activity, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "../lib/api";
import { storeSession } from "../lib/auth";
import { Button, ErrorBanner, Field, inputClass } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const session = await login(username, password);
      storeSession(session);
      router.replace(searchParams.get("next") || "/dashboard");
    } catch {
      setFormError("Credentials were rejected. Check the username and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#d8e1d8] bg-white p-6 shadow-[0_24px_80px_rgba(23,32,27,0.08)]">
        <div className="mb-8">
          <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-md bg-[#2f6b4f] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f6b4f]">
            Adapter Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#17201b]">
            Sign in to operations
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#637166]">
            Use your admin credentials to manage institutions, records, logs,
            and manual patient submissions.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={onSubmit}>
          {formError ? <ErrorBanner message={formError} /> : null}

          <Field error={errors.username} label="Username">
            <input
              autoComplete="username"
              className={inputClass}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              value={username}
            />
          </Field>

          <Field error={errors.password} label="Password">
            <input
              autoComplete="current-password"
              className={inputClass}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin-password"
              type="password"
              value={password}
            />
          </Field>

          <Button className="mt-2 w-full" disabled={submitting} type="submit">
            {submitting ? (
              <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
