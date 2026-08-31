"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/catalog/new", label: "New product" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/platforms", label: "Platforms" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/integrations/1epin", label: "Integrations" },
  { href: "/admin/integrations/1epin/logs", label: "1Epin logs" },
  { href: "/admin/integrations/1epin/test", label: "1Epin test orders" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/administrators", label: "Administrators" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminCommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const results = useMemo(
    () => ITEMS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mmh-admin-command", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mmh-admin-command", onCustom);
    };
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0B1538]/40 p-6" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border border-[#E7EAF1] bg-white shadow-lg" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Command menu">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to a page"
          className="h-12 w-full border-b border-[#E7EAF1] px-4 text-sm"
        />
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="flex h-9 w-full items-center rounded-lg px-3 text-start text-sm hover:bg-[#F5F7FB]"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
