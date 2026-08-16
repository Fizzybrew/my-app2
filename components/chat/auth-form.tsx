import Form from "next/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <Form action={action}>
      <Label className="sr-only" htmlFor="email">
        Email
      </Label>
      <Input
        autoComplete="email"
        autoFocus
        defaultValue={defaultEmail}
        id="email"
        name="email"
        placeholder="Email address"
        required
        type="email"
      />

      <Label className="sr-only" htmlFor="password">
        Password
      </Label>
      <Input
        id="password"
        name="password"
        placeholder="Password"
        required
        type="password"
      />

      {children}
    </Form>
  );
}
