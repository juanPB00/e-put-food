import AuthShell from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";

export default function Register({ searchParams }: { searchParams: { as?: string } }) {
  return (<AuthShell><RegisterForm initial={searchParams.as || "user"} /></AuthShell>);
}
