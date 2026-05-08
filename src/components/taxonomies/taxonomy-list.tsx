"use client";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createTaxonomy, deleteTaxonomy } from "@/actions/taxonomies";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaxonomyType } from "@/utils/taxonomy-crud";

type T = TaxonomyType;

interface TaxonomyItem {
  id: string;
  name: string;
  sectorId?: string | null;
  industryId?: string | null;
}

interface TaxonomyListProps {
  title: string;
  type: T;
  items: TaxonomyItem[];
  parents?: TaxonomyItem[];
  parentType?: "sectors" | "industries";
  onSelect?: (id: string) => void;
}

export function TaxonomyList({
  title,
  type,
  items,
  parents = [],
  parentType,
  onSelect,
}: TaxonomyListProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | undefined>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showParentSelect =
    (type === "industries" && parentType === "sectors") ||
    (type === "key_businesses" && parentType === "industries");

  async function add() {
    if (!name.trim()) return;
    try {
      await createTaxonomy({
        type,
        name: name.trim(),
        parentId:
          showParentSelect && parentId && parentId !== "__none__"
            ? parentId
            : undefined,
      });
      setName("");
      setParentId("");
      toast.success(`${name.trim()} added`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    }
  }

  async function handleDeleteClick(id: string) {
    setDeleteId(id);
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    try {
      const result = await deleteTaxonomy({ type, id: deleteId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          {showParentSelect && (
            <Select
              value={parentId || ""}
              onValueChange={(v) =>
                setParentId(v === "__none__" ? "" : v || "")
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {parentId && parentId !== "__none__"
                    ? parents.find((p) => p.id === parentId)?.name
                    : "Select parent"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add…"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button size="icon" onClick={add}>
              <PlusIcon size={16} />
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          {items.map((i) => (
            <div
              key={i.id}
              className={`flex items-center justify-between rounded text-sm hover:bg-muted ${selectedId === i.id ? "bg-muted font-medium" : ""
                }`}
            >
              <Button
                className="flex-1 text-left bg-muted text-black"
                onClick={() => {
                  if (onSelect) {
                    setSelectedId(selectedId === i.id ? null : i.id);
                    onSelect(selectedId === i.id ? "" : i.id);
                  }
                }}
              >
                {i.name}
              </Button>
              <Button
                className="bg-muted text-black"
                onClick={() => handleDeleteClick(i.id)}
              >
                <TrashIcon size={16} />
              </Button>
            </div>
          ))}
          {!items.length && (
            <div className="text-xs text-muted-foreground">Empty</div>
          )}
        </div>
      </CardContent>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            item.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
