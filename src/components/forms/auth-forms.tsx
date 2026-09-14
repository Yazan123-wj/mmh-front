"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useLanguage } from "@/context/language-context";
import { isValidEmail } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerCustomer } from "@/server/actions/customer-auth";

export function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!isValidEmail(email) || password.length < 8) {
          setError(t("auth.short"));
          return;
        }
        setError("");
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) {
          setError(t("auth.invalid"));
          return;
        }
        router.push("/account");
        router.refresh();
      }}
    >
      <h1 className="text-2xl font-semibold">{t("auth.loginTitle")}</h1>
      <Field label={t("checkout.email")} value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label={t("auth.password")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full">{t("auth.submitLogin")}</Button>
      <Link href="/register" className="block text-center text-sm text-accent">{t("account.register")}</Link>
    </form>
  );
}

export function RegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim() || !isValidEmail(email)) {
          setError(t("checkout.required"));
          return;
        }
        if (password.length < 12) {
          setError(t("auth.short"));
          return;
        }
        if (password !== confirm) {
          setError(t("auth.mismatch"));
          return;
        }
        const registration = await registerCustomer({ name, email, phone, password });
        if (!registration.ok) {
          setError(registration.error === "password" ? t("auth.strongPassword") : t("auth.registerUnavailable"));
          return;
        }
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) {
          setError(t("auth.invalid"));
          return;
        }
        router.push("/account");
        router.refresh();
      }}
    >
      <h1 className="text-2xl font-semibold">{t("auth.registerTitle")}</h1>
      <Field label={t("checkout.name")} value={name} onChange={(event) => setName(event.target.value)} />
      <Field label={t("checkout.email")} value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label={t("checkout.phone")} value={phone} onChange={(event) => setPhone(event.target.value)} />
      <Field label={t("auth.password")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <Field label={t("auth.confirm")} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full">{t("auth.submitRegister")}</Button>
      <Link href="/login" className="block text-center text-sm text-accent">{t("account.signIn")}</Link>
    </form>
  );
}
