import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccountEmailDisplayProps {
  email: string;
}

export function AccountEmailDisplay({ email }: AccountEmailDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">Email address</h3>

        <p className="text-sm text-muted-foreground">
          The email address associated with your account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>

        <Input
          id="email"
          type="email"
          value={email}
          className="h-12"
          readOnly
          disabled
        />
      </div>
    </div>
  );
}
