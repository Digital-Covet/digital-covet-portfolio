import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "../shared";

type StoryKey = "description" | "challenge" | "solution" | "results";

type StoryProps = {
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  onUpdate: <K extends StoryKey>(key: K, value: string | null) => void;
};

export function StorySection({
  description,
  challenge,
  solution,
  results,
  onUpdate,
}: StoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Story</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          label="Description"
          value={description}
          onChangeAction={(v) => onUpdate("description", v)}
          rows={5}
          enableMarkdown={true}
        />
        <Field
          label="Challenge"
          value={challenge}
          onChangeAction={(v) => onUpdate("challenge", v)}
          rows={4}
          enableMarkdown={true}
        />
        <Field
          label="Solution"
          value={solution}
          onChangeAction={(v) => onUpdate("solution", v)}
          rows={4}
          enableMarkdown={true}
        />
        <Field
          label="Results"
          value={results}
          onChangeAction={(v) => onUpdate("results", v)}
          rows={4}
          enableMarkdown={true}
        />
      </CardContent>
    </Card>
  );
}
