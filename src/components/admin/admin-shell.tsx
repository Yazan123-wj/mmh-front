"use client";

import { ClicksLogo } from "@/components/admin/clicks-logo";
import { AdminCommandMenu } from "@/components/admin/command-menu";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  Boxes,
  FileText,
  FolderTree,
  ImageIcon,
  LayoutDashboard,
  Link2,
  ListTodo,
  LogOut,
  Menu,
  Percent,
  ScrollText,
  Search,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/catalog", label: "Catalog", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/platforms", label: "Platforms", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/pricing", label: "Pricing", icon: Percent },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/integrations/1epin", label: "Integrations", icon: Link2 },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/administrators", label: "Administrators", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="clicks-shell flex min-h-screen">
      {open ? <button className="fixed inset-0 z-30 bg-[#0B1538]/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu" /> : null}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex flex-col bg-[#0B1538] text-white transition-[width] lg:static",
          collapsed ? "w-[72px]" : "w-[240px]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          {collapsed ? <span className="text-xs font-bold">CD</span> : <ClicksLogo variant="dark" />}
          <button type="button" className="hidden rounded-md p-1 text-white/70 hover:bg-white/10 lg:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label="Collapse sidebar">
            <ListTodo className="h-4 w-4" />
          </button>
        </div>
        <p className={cn("px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45", collapsed && "sr-only")}>MMH Commerce</p>
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "mb-0.5 flex h-9 items-center gap-2 rounded-lg px-2 text-[13px]",
                  active ? "bg-[#0040FD] text-white" : "text-white/75 hover:bg-white/8 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {collapsed ? null : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E7EAF1] bg-white px-4">
          <button type="button" className="rounded-md p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <label className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#616674]" />
            <input
              placeholder="Search or press ⌘K"
              readOnly
              onFocus={() => window.dispatchEvent(new Event("mmh-admin-command"))}
              className="h-9 w-full rounded-lg border border-[#E7EAF1] bg-[#F5F7FB] ps-9 pe-3 text-sm"
            />
          </label>
          <div className="ms-auto flex items-center gap-3 text-sm">
            <div className="text-end">
              <p className="font-medium leading-4">{name}</p>
              <p className="text-[11px] text-[#616674]">{role.replaceAll("_", " ")}</p>
            </div>
            <button type="button" className="rounded-md border border-[#E7EAF1] p-2" onClick={() => signOut({ callbackUrl: "/admin/login" })} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
      <AdminCommandMenu />
    </div>
  );
}
