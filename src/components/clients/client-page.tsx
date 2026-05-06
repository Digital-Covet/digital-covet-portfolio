"use client";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteClient, upsertClient } from "@/actions/content";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileUploader, ImagePreview } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Taxonomies {
  industries: { id: string; name: string }[];
  categories: any[];
  services: any[];
  clients: {
    id: string;
    name: string;
    logoUrl: string | null;
    industryId: string | null;
  }[];
}

type EditingClient =
  | Taxonomies["clients"][number]
  | {
      id?: string;
      name: string;
      logoUrl: string | null;
      industryId: string | null;
    };

export function ClientsPage({ taxonomies }: { taxonomies: Taxonomies }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<EditingClient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function save() {
    if (!editing?.name) return;
    startTransition(async () => {
      try {
        await upsertClient({
          id: editing.id,
          name: editing.name,
          logoUrl: editing.logoUrl ?? null,
          industryId: editing.industryId ?? null,
        });
        toast.success("Saved");
        setEditing(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteClient({ id: deleteId });
        toast.success("Deleted");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      } finally {
        setDeleteId(null);
      }
    });
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage client logos and info.
          </p>
        </div>
        <Button
          onClick={() =>
            setEditing({ name: "", logoUrl: null, industryId: null })
          }
          disabled={isPending}
        >
          <PlusIcon size={16} className="mr-2" /> New client
        </Button>
      </div>

      {editing && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              {editing.id ? "Edit client" : "New client"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={editing.industryId ?? "none"}
                onValueChange={(v) =>
                  setEditing({
                    ...editing,
                    industryId: v === "none" ? null : v,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry">
                    {editing.industryId
                      ? taxonomies.industries.find((i) => i.id === editing.industryId)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {taxonomies.industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex flex-wrap items-center gap-3">
                {editing.logoUrl && (
                  <ImagePreview
                    url={editing.logoUrl}
                    onRemove={() => setEditing({ ...editing, logoUrl: null })}
                  />
                )}
                <FileUploader
                  bucket="client-logos"
                  accept="image/*"
                  label="Upload logo"
                  onUploaded={(f) => setEditing({ ...editing, logoUrl: f.url })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={isPending}>
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditing(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-3">
        {taxonomies.clients.map((c) => (
          <Card
            key={c.id}
            className="flex items-center justify-between gap-3 p-4"
          >
            <div className="flex items-center gap-4">
              {c.logoUrl ? (
                <img
                  src={c.logoUrl}
                  alt=""
                  className="h-12 w-12 rounded border object-contain bg-white"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-muted" />
              )}
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {taxonomies.industries.find((i) => i.id === c.industryId)
                    ?.name ?? "—"}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(c)}
                disabled={isPending}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(c.id)}
                disabled={isPending}
              >
                <TrashIcon size={16} />
              </Button>
            </div>
          </Card>
        ))}
        {!taxonomies.clients.length && (
          <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
            No clients yet.
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this client.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
