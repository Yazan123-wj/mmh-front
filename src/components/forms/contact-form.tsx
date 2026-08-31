"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TEXTAREA } from "@/components/ui/control";
import { SITE } from "@/config/site";
import { useToast } from "@/context/toast-context";
import { isValidDemoPhone, isValidEmail } from "@/lib/validation";
import { useState } from "react";

export function ContactForm() {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim() || !isValidEmail(email) || !isValidDemoPhone(phone) || message.trim().length < 8) {
          push({ title: "Check the required fields.", tone: "error" });
          return;
        }
        push({
          title: "Message stored on this device only.",
          description: "A real inbox will connect in Phase 2.",
          tone: "success",
        });
        setMessage("");
      }}
    >
      <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} />
      <Field label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Field label="Phone" hint={SITE.contact.phoneNote} value={phone} onChange={(event) => setPhone(event.target.value)} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Message</span>
        <textarea
          className={TEXTAREA}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <Button type="submit" className="w-full sm:w-auto">Send message</Button>
    </form>
  );
}
