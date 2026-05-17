import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "../shared";

type TestimonialKey = "quote" | "author" | "title";

type TestimonialProps = {
  quote: string | null;
  author: string | null;
  title: string | null;
  onUpdate: <K extends TestimonialKey>(key: K, value: string | null) => void;
};

export function TestimonialSection({
  quote,
  author,
  title,
  onUpdate,
}: TestimonialProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Testimonial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          label="Quote"
          value={quote}
          onChangeAction={(v) => onUpdate("quote", v)}
          rows={4}
          enableMarkdown={true}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              value={author ?? ""}
              onChange={(e) => onUpdate("author", e.target.value || null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title ?? ""}
              onChange={(e) => onUpdate("title", e.target.value || null)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
