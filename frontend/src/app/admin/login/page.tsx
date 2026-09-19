import { AdminLoginForm } from "@/components/admin/login-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.kind === "ADMIN") redirect("/admin");
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
