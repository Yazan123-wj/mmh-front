import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Privacy", "Frontend privacy placeholder for MMH.", "/privacy");

export default function PrivacyPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 text-sm leading-7 text-muted md:py-14">
      <h1 className="text-2xl font-semibold text-fg sm:text-3xl">Privacy</h1>
      <p className="mt-6">
        Phase 1 stores cart, wishlist, language, and a demo account in your browser only. No personal data is sent to a
        MMH server yet. A full privacy notice will replace this page when the backend is connected.
      </p>
    </div>
  );
}
