"use client";

import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { MobileFilters } from "@/components/shop/mobile-filters";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectField } from "@/components/ui/select-field";
import { FOCUS_RING, ICON_HIT } from "@/components/ui/control";
import { applyFilters, countActiveFilters, emptyFilters, filtersToQuery } from "@/lib/catalog";
import { getCategory } from "@/data/categories";
import { PRODUCTS, uniqueRegions } from "@/data/products";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/cn";
import type { FilterState, Product, SortOption } from "@/types";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const SORTS: SortOption[] = ["featured", "newest", "price-asc", "price-desc", "rating", "discount"];

export function ShopCatalog({
  initial,
  source = PRODUCTS,
  basePath = "/shop",
}: {
  initial: FilterState;
  source?: Product[];
  basePath?: string;
}) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(initial);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lockedCategory = initial.category || undefined;

  const results = useMemo(() => applyFilters(source, filters), [source, filters]);
  const activeCount = countActiveFilters({ ...filters, category: lockedCategory ? "" : filters.category });

  const update = (next: FilterState) => {
    const synced = lockedCategory ? { ...next, category: lockedCategory } : next;
    setFilters(synced);
    const query = filtersToQuery(synced);
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  };

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.q) chips.push({ key: "q", label: filters.q, clear: () => update({ ...filters, q: "" }) });
  if (filters.category && !lockedCategory) {
    const category = getCategory(filters.category);
    chips.push({
      key: "category",
      label: locale === "ar" ? category?.nameAr ?? filters.category : category?.name ?? filters.category,
      clear: () => update({ ...filters, category: "" }),
    });
  }
  if (filters.brand) chips.push({ key: "brand", label: filters.brand, clear: () => update({ ...filters, brand: "" }) });
  if (filters.type) chips.push({ key: "type", label: filters.type === "direct_topup" ? t("filter.topup") : t("filter.code"), clear: () => update({ ...filters, type: "" }) });
  if (filters.kind) chips.push({ key: "kind", label: t(`filter.kind.${filters.kind}`), clear: () => update({ ...filters, kind: "" }) });
  if (filters.platform) chips.push({ key: "platform", label: filters.platform, clear: () => update({ ...filters, platform: "" }) });
  if (filters.region) {
    const region = uniqueRegions().find((item) => item.id === filters.region);
    chips.push({
      key: "region",
      label: locale === "ar" ? region?.nameAr ?? filters.region : region?.name ?? filters.region,
      clear: () => update({ ...filters, region: "" }),
    });
  }
  if (typeof filters.min === "number") chips.push({ key: "min", label: `≥ ${filters.min}`, clear: () => update({ ...filters, min: undefined }) });
  if (typeof filters.max === "number") chips.push({ key: "max", label: `≤ ${filters.max}`, clear: () => update({ ...filters, max: undefined }) });
  if (filters.availability === "in_stock") {
    chips.push({ key: "stock", label: t("filter.inStock"), clear: () => update({ ...filters, availability: "" }) });
  }
  if (filters.discount) chips.push({ key: "sale", label: t("filter.discount"), clear: () => update({ ...filters, discount: false }) });
  if (filters.rating) chips.push({ key: "rating", label: `${filters.rating}+`, clear: () => update({ ...filters, rating: undefined }) });

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <div className="hidden min-h-0 lg:block">
        <div className="filter-scroll sticky top-[5.5rem] max-h-[calc(100dvh-6.75rem)] overflow-y-auto overscroll-contain pe-2">
          <FilterSidebar value={filters} onChange={update} lockedCategory={lockedCategory} />
        </div>
      </div>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {results.length} {t("common.results")}
          </p>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] border border-line px-3 text-sm sm:flex-none lg:hidden", FOCUS_RING)}
              onClick={() => setMobileOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("common.filters")}
              {activeCount > 0 ? <span className="rounded-full bg-gold px-1.5 text-[11px] font-bold text-elevated">{activeCount}</span> : null}
            </button>
            <SelectField
              aria-label={t("common.sort")}
              className="min-w-0 flex-1 sm:w-[min(100%,220px)] sm:flex-none"
              value={filters.sort ?? "featured"}
              onChange={(event) => update({ ...filters, sort: event.target.value as SortOption })}
            >
              {SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t(`sort.${sort}`)}
                </option>
              ))}
            </SelectField>
            <div className="hidden overflow-hidden rounded-[12px] border border-line sm:flex">
              <button
                type="button"
                className={cn(ICON_HIT, "rounded-none", filters.view !== "list" && "bg-brand text-fg")}
                onClick={() => update({ ...filters, view: "grid" })}
                aria-label={t("common.grid")}
                aria-pressed={filters.view !== "list"}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(ICON_HIT, "rounded-none", filters.view === "list" && "bg-brand text-fg")}
                onClick={() => update({ ...filters, view: "list" })}
                aria-label={t("common.list")}
                aria-pressed={filters.view === "list"}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {chips.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={cn("inline-flex h-8 items-center gap-1 rounded-md border border-transparent bg-brand px-2 text-xs text-fg hover:bg-accent", FOCUS_RING)}
                onClick={chip.clear}
              >
                {chip.label}
                <X className="h-3 w-3 text-gold" />
              </button>
            ))}
            <button
              type="button"
              className={cn("h-8 px-1 text-xs text-muted hover:text-fg", FOCUS_RING)}
              onClick={() => update(emptyFilters({ sort: filters.sort, view: filters.view, category: lockedCategory }))}
            >
              {t("common.clearAll")}
            </button>
          </div>
        ) : null}
        {results.length === 0 ? (
          <EmptyState title={t("common.noResults")} actionHref="/shop" actionLabel={t("common.resetFilters")} />
        ) : (
          <ProductGrid products={results} view={filters.view === "list" ? "list" : "grid"} />
        )}
      </div>
      <MobileFilters
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        value={filters}
        onChange={update}
        lockedCategory={lockedCategory}
      />
    </div>
  );
}
