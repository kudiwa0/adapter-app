"use client";

import {
  Activity,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createInstitution,
  getInstitutions,
  revokeInstitution,
} from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { CreatedInstitution, Institution } from "../lib/types";
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  inputClass,
  LoadingRows,
  PageHeader,
  Panel,
  StatusBadge,
} from "./ui";

const API_KEYS_STORAGE_KEY = "adapter-institution-api-keys";

function readStoredApiKeys() {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = window.localStorage.getItem(API_KEYS_STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored) as Record<number, string>;
  } catch {
    window.localStorage.removeItem(API_KEYS_STORAGE_KEY);
    return {};
  }
}

export function InstitutionsView() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [created, setCreated] = useState<CreatedInstitution | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [apiKeys, setApiKeys] = useState<Record<number, string>>(readStoredApiKeys);
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [copyNotice, setCopyNotice] = useState("");

  useEffect(() => {
    if (!copyNotice) {
      return;
    }

    const timeout = window.setTimeout(() => setCopyNotice(""), 2400);

    return () => window.clearTimeout(timeout);
  }, [copyNotice]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getInstitutions();

        if (mounted) {
          setInstitutions(data);
        }
      } catch {
        if (mounted) {
          setError("Institutions could not be loaded.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return institutions;
    }

    return institutions.filter((institution) =>
      institution.name.toLowerCase().includes(normalized),
    );
  }, [institutions, query]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError("");
    setError("");

    if (!name.trim()) {
      setFieldError("Institution name is required.");
      return;
    }

    setSaving(true);

    try {
      const result = await createInstitution({
        name: name.trim(),
        is_active: active,
      });

      setCreated(result);
      rememberApiKey(result.id, result.api_key);
      const institution: Institution = {
        id: result.id,
        name: result.name,
        is_active: result.is_active,
        created_at: result.created_at,
      };
      setInstitutions((current) => [institution, ...current]);
      setName("");
      setActive(true);
    } catch {
      setError("Institution could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function onRevoke(institution: Institution) {
    const confirmed = window.confirm(
      `Revoke access for ${institution.name}? This disables its adapter key.`,
    );

    if (!confirmed) {
      return;
    }

    await revokeInstitution(institution.id);
    setInstitutions((current) =>
      current.map((item) =>
        item.id === institution.id ? { ...item, is_active: false } : item,
      ),
    );
  }

  function rememberApiKey(id: number, apiKey: string) {
    setApiKeys((current) => {
      const next = { ...current, [id]: apiKey };
      window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function copyKey(apiKey: string, label = "API key copied") {
    await navigator.clipboard.writeText(apiKey);
    setCopyNotice(label);
  }

  return (
    <>
      {copyNotice ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-[#bfe6d5] bg-white px-4 py-3 shadow-[0_18px_60px_rgba(23,32,27,0.18)]">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e9f8f1] text-[#13795b]">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#17201b]">{copyNotice}</p>
              <p className="text-xs text-[#637166]">Ready to share securely.</p>
            </div>
          </div>
        </div>
      ) : null}

      <PageHeader
        description="Register data-sending institutions, track their access state, and reveal newly generated API keys only once."
        eyebrow="Institutions"
        title="Manage source systems"
      />

      <div className="grid gap-6">
        <div className="grid content-start gap-6">
          <Panel
            description="The generated API key is shown once after creation."
            title="Register institution"
          >
            <form className="grid gap-4" onSubmit={onCreate}>
              {error ? <ErrorBanner message={error} /> : null}
              <Field error={fieldError} label="Institution name">
                <input
                  className={inputClass}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="OpenMRS General Hospital"
                  value={name}
                />
              </Field>
              <label className="flex items-center gap-3 rounded-md border border-[#d8e1d8] bg-[#fbfcfa] px-3 py-3 text-sm font-medium text-[#2d392f]">
                <input
                  checked={active}
                  className="h-4 w-4 accent-[#2f6b4f]"
                  onChange={(event) => setActive(event.target.checked)}
                  type="checkbox"
                />
                Active on creation
              </label>
              <Button disabled={saving} type="submit">
                {saving ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create institution
              </Button>
            </form>
          </Panel>

          {created ? (
            <Panel title="Generated API key">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 rounded-md border border-[#bfe6d5] bg-[#e9f8f1] p-4">
                  <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#13795b]" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#17201b]">
                      {created.name}
                    </p>
                    <button
                      className="mt-2 block break-all text-left font-mono text-sm text-[#1f4d39] underline decoration-[#9ecfba] decoration-dotted underline-offset-4 transition hover:text-[#13795b]"
                      onClick={() => copyKey(created.api_key)}
                      title="Copy API key"
                      type="button"
                    >
                      {created.api_key}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => copyKey(created.api_key)}
                  type="button"
                  variant="secondary"
                >
                  <Copy className="h-4 w-4" />
                  Copy key
                </Button>
              </div>
            </Panel>
          ) : null}
        </div>

        <Panel
          action={
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#637166]" />
              <input
                className={`${inputClass} pl-9`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search institutions"
                value={query}
              />
            </label>
          }
          description="Keys are available here only after this frontend has generated them from the live API."
          title="Institution list"
        >
          {loading ? (
            <LoadingRows rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              description="Create an institution or adjust the current search."
              title="No institutions found"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-[#637166]">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">API Key</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e9e3]">
                  {filtered.map((institution) => {
                    const apiKey = apiKeys[institution.id] || institution.api_key;
                    const isVisible = Boolean(visibleKeys[institution.id]);

                    return (
                      <tr key={institution.id}>
                        <td className="py-3 pr-4 font-medium text-[#17201b]">
                          {institution.name}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              aria-label={`API key for ${institution.name}`}
                              className="h-9 w-64 rounded-md border border-[#d8e1d8] bg-[#f8faf7] px-2 font-mono text-xs text-[#1f4d39] shadow-sm"
                              readOnly
                              title={
                                apiKey
                                  ? "Institution API key"
                                  : "This API key is only available immediately after creation."
                              }
                              type={apiKey && isVisible ? "text" : "password"}
                              value={apiKey || "api-key-not-available"}
                            />
                            <button
                              aria-label={isVisible ? "Hide API key" : "Show API key"}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-[#637166] transition hover:bg-[#edf2ed] hover:text-[#17201b] disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={!apiKey}
                              onClick={() =>
                                setVisibleKeys((current) => ({
                                  ...current,
                                  [institution.id]: !current[institution.id],
                                }))
                              }
                              title={isVisible ? "Hide API key" : "Show API key"}
                              type="button"
                            >
                              {isVisible ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              aria-label="Copy API key"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-[#637166] transition hover:bg-[#edf2ed] hover:text-[#17201b] disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={!apiKey}
                              onClick={() =>
                                apiKey
                                  ? copyKey(`${apiKey}`, `${institution.name} API key copied`)
                                  : undefined
                              }
                              title={
                                apiKey
                                  ? "Copy API key"
                                  : "This API key is only available immediately after creation."
                              }
                              type="button"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            tone={institution.is_active ? "success" : "neutral"}
                          >
                            {institution.is_active ? "Active" : "Revoked"}
                          </StatusBadge>
                        </td>
                        <td className="py-3 pr-4 text-[#637166]">
                          {formatDateTime(institution.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            disabled={!institution.is_active}
                            onClick={() => onRevoke(institution)}
                            type="button"
                            variant="secondary"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
