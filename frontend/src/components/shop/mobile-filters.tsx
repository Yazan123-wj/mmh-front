"use client";

import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { Button } from "@/components/ui/button";
import { ICON_HIT } from "@/components/ui/control";
import { useLanguage } from "@/context/language-context";
import { useEscape, useScrollLock } from "@/hooks/use-overlay";
import { countActiveFilters, emptyFilters } from "@/lib/catalog";
import type { FilterState } from "@/types";
import { X } from "lucide-react";
import { useState } from "react";

export function MobileFilters({
  open,
  onClose,
  value,
  onChange,
  lockedCategory,
}: {
  open: boolean;
  onClose: () => void;
  value: FilterState;
  onChange: (next: FilterState) => void;
  lockedCategory?: string;
}) {
  useScrollLock(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <MobileFiltersPanel
      value={value}
      onChange={onChange}
      onClose={onClose}
      lockedCategory={lockedCategory}
    />
  );
}

function MobileFiltersPanel({
  value,
  onChange,
  onClose,
  lockedCategory,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClose: () => void;
  lockedCategory?: string;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(value);
  const count = countActiveFilters(draft);

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button type="button" className="absolute inset-0 bg-overlay" onClick={onClose} aria-label={t("common.close")} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("common.filters")}
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[16px] border border-line bg-elevated pb-[env(safe-area-inset-bottom)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold">
            {t("common.filters")}
            {count > 0 ? <span className="ms-2 text-sm text-gold">({count})</span> : null}
          </h2>
          <button type="button" className={ICON_HIT} onClick={onClose} aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterSidebar value={draft} onChange={setDraft} lockedCategory={lockedCategory} showReset={false} />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line bg-elevated px-5 py-4">
          <Button
            variant="secondary"
            onClick={() => setDraft(emptyFilters({ sort: value.sort, view: value.view, category: lockedCategory }))}
          >
            {t("common.resetFilters")}
          </Button>
          <Button
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            {t("common.apply")}
          </Button>
        </div>
      </aside>
    </div>
  );
}
