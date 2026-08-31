"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useAccount } from "@/context/account-context";
import { useLanguage } from "@/context/language-context";
import { isValidEmail } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
  const { t } = useLanguage();
  const { login } = useAccount();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isValidEmail(email) || password.length < 8) {
          setError(t("auth.short"));
          return;
        }
        login(email);
        router.push("/account");
      }}
    >
      <h1 className="text-2xl font-semibold">{t("auth.loginTitle")}</h1>
      <p className="text-sm text-muted">{t("auth.demo")}</p>
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
  const { login } = useAccount();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim() || !isValidEmail(email)) {
          setError(t("checkout.required"));
          return;
        }
        if (password.length < 8) {
          setError(t("auth.short"));
          return;
        }
        if (password !== confirm) {
          setError(t("auth.mismatch"));
          return;
        }
        login(email, name);
        router.push("/account");
      }}
    >
      <h1 className="text-2xl font-semibold">{t("auth.registerTitle")}</h1>
      <p className="text-sm text-muted">{t("auth.demo")}</p>
      <Field label={t("checkout.name")} value={name} onChange={(event) => setName(event.target.value)} />
      <Field label={t("checkout.email")} value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label={t("auth.password")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <Field label={t("auth.confirm")} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full">{t("auth.submitRegister")}</Button>
      <Link href="/login" className="block text-center text-sm text-accent">{t("account.signIn")}</Link>
    </form>
  );
}
