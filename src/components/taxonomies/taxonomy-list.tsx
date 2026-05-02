"use client";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { createTaxonomy, deleteTaxonomy } from "@/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TaxonomyType } from "@/utils/taxonomy-crud";

type T = TaxonomyType;

interface TaxonomyListProps {
  title: string;
  type: T;
  items: { id: string; name: string }[];
}

export function TaxonomyList({ title, type, items }: TaxonomyListProps) {
  const [name, setName] = useState("");

  async function add() {
    if (!name.trim()) return;
    try {
      await createTaxonomy({ type, name: name.trim() });
      setName("");
      toast.success(`${name.trim()} added`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    }
  }

  async function remove(id: string) {
    try {
      await deleteTaxonomy({ type, id });
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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
        <div className="space-y-1">
          {items.map((i) => (
            <div
              key={i.id}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span>{i.name}</span>
              <button onClick={() => remove(i.id)}>
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
          {!items.length && (
            <div className="text-xs text-muted-foreground">Empty</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
