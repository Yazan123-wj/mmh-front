import { FAQ_ITEMS } from "@/data/faq";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("FAQ", "Digital codes, regions, top-ups, and MMH store questions.", "/faq");

export default function FaqPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 md:py-14">
      <h1 className="text-2xl font-semibold sm:text-3xl">Frequently asked questions</h1>
      <div className="mt-8 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.id} className="rounded-[12px] border border-line bg-card p-4">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-2 text-sm leading-6 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
