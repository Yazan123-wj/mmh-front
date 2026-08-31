import { RegisterForm } from "@/components/forms/auth-forms";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="container-mmh py-10 md:py-16">
      <RegisterForm />
    </div>
  );
}
