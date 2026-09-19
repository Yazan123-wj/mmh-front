import { LoginForm } from "@/components/forms/auth-forms";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="container-mmh py-10 md:py-16">
      <LoginForm />
    </div>
  );
}
