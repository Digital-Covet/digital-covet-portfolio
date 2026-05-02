"use client";

import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createShare } from "@/actions/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaxonomyItem {
  id: string;
  name: string;
}

interface Taxonomies {
  industries: TaxonomyItem[];
  categories: TaxonomyItem[];
  services: TaxonomyItem[];
  clients: TaxonomyItem[];
}

interface CaseStudy {
  id: string;
  title: string;
  status: string;
  client: { name: string } | null;
}

interface NewShareFormProps {
  taxonomies: Taxonomies;
  studies: CaseStudy[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let p = "";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 14; i++) p += chars[arr[i] % chars.length];
  return p;
}

function toggle(arr: string[], setArr: (a: string[]) => void, id: string) {
  setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Pills({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: TaxonomyItem[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(it.id)}
              className={`rounded-full border px-3 py-1 text-xs ${selected.includes(it.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted"
                }`}
            >
              {it.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">None defined.</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main form component                                                */
/* ------------------------------------------------------------------ */

export function NewShareForm({ taxonomies, studies }: NewShareFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [filterMode, setFilterMode] = useState<"filter" | "specific">("filter");
  const [industries, setIndustries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [specific, setSpecific] = useState<string[]>([]);
  const [created, setCreated] = useState<{
    url: string;
    password: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createShare({
        name: name.trim(),
        password,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_views: maxViews ? Number(maxViews) : null,
        filter_industry_ids: filterMode === "filter" ? industries : [],
        filter_category_ids: filterMode === "filter" ? categories : [],
        filter_service_ids: filterMode === "filter" ? services : [],
        filter_client_ids: filterMode === "filter" ? clients : [],
        specific_case_study_ids: filterMode === "specific" ? specific : [],
      });
      const url = `${window.location.origin}${res.url}`;
      setCreated({ url, password });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create share link",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Success view ────────────────────────────────────────────────── */

  if (created) {
    return (
      <div className="mx-auto max-w-2xl p-6 md:p-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckIcon size={16} className="text-green-600" /> Share created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <code className="flex-1 break-all rounded border bg-muted/40 px-3 py-2 text-sm">
                  {created.url}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(created.url);
                    toast.success("Copied");
                  }}
                >
                  <CopyIcon size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <code className="flex-1 rounded border bg-muted/40 px-3 py-2 text-sm font-mono">
                  {created.password}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(created.password);
                    toast.success("Copied");
                  }}
                >
                  <CopyIcon size={16} />
                </Button>
              </div>
            </div>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Save the password now. For security, it cannot be shown again.
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/shares")}>
                Back to shares
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreated(null);
                  setName("");
                  setPassword(genPassword());
                }}
              >
                Create another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Form view ───────────────────────────────────────────────────── */

  return (
    <div className="p-6 md:p-10">
      <Link
        href="/shares"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon size={16} className="mr-1" /> Back
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">New share link</h1>

      <div className="mt-6 space-y-6">
        {/* ── Details card ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Share name (internal)</Label>
              <Input
                placeholder="e.g. Acme Pitch — Fintech work"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Recipient name (optional)</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Recipient email (optional)</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expires at (optional)</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max views (optional)</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPassword(genPassword())}
                >
                  <ArrowClockwiseIcon size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── What to include card ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What to include</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={filterMode === "filter" ? "default" : "outline"}
                onClick={() => setFilterMode("filter")}
              >
                Filter by tags
              </Button>
              <Button
                type="button"
                variant={filterMode === "specific" ? "default" : "outline"}
                onClick={() => setFilterMode("specific")}
              >
                Pick specific
              </Button>
            </div>

            {filterMode === "filter" ? (
              <div className="space-y-4">
                <Pills
                  label="Industries"
                  items={taxonomies.industries}
                  selected={industries}
                  onToggle={(id) => toggle(industries, setIndustries, id)}
                />
                <Pills
                  label="Work categories"
                  items={taxonomies.categories}
                  selected={categories}
                  onToggle={(id) => toggle(categories, setCategories, id)}
                />
                <Pills
                  label="Services"
                  items={taxonomies.services}
                  selected={services}
                  onToggle={(id) => toggle(services, setServices, id)}
                />
                <Pills
                  label="Clients"
                  items={taxonomies.clients}
                  selected={clients}
                  onToggle={(id) => toggle(clients, setClients, id)}
                />
                <p className="text-xs text-muted-foreground">
                  Empty = no filter. Multiple values within a section act as OR.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select case studies</Label>
                <div className="grid max-h-96 gap-2 overflow-auto rounded-md border p-2">
                  {studies.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={specific.includes(s.id)}
                        onChange={() => toggle(specific, setSpecific, s.id)}
                      />
                      <span className="text-sm">{s.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {s.client?.name ?? ""}
                      </span>
                    </label>
                  ))}
                  {!studies.length && (
                    <div className="p-3 text-sm text-muted-foreground">
                      No published case studies.
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Creating…" : "Create share link"}
        </Button>
      </div>
    </div>
  );
}
