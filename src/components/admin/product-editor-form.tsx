"use client";

import { useState } from "react";
import { createProduct, updateProduct } from "@/server/actions/admin";

type Option = { id: string; label: string };

export function ProductEditorForm({
  mode,
  categories,
  platforms,
  product,
}: {
  mode: "create" | "edit";
  categories: Option[];
  platforms: Option[];
  product?: {
    id: string;
    slug: string;
    brand: string;
    artworkKey: string;
    kind: string;
    fulfillmentType: string;
    categoryId: string;
    platformId: string;
    featured: boolean;
    bestseller: boolean;
    refundable: boolean;
    seoTitle?: string | null;
    seoDescription?: string | null;
    nameEn: string;
    nameAr: string;
    shortEn: string;
    shortAr: string;
    descriptionEn: string;
    descriptionAr: string;
    instructionsEn: string;
    instructionsAr: string;
  };
}) {
  const [section, setSection] = useState("general");
  const action = mode === "create" ? createProduct : updateProduct;
  const sections = [
    ["general", "General"],
    ["localization", "Localization"],
    ["delivery", "Delivery"],
    ["seo", "SEO"],
    ["publishing", "Publishing"],
  ];

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-[200px_1fr]">
      {mode === "edit" ? <input type="hidden" name="id" value={product?.id} /> : null}
      <nav className="rounded-xl border border-[#E7EAF1] bg-white p-2 h-fit">
        {sections.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`mb-0.5 flex h-8 w-full items-center rounded-lg px-2 text-start text-[13px] ${
              section === id ? "bg-[#0040FD] text-white" : "text-[#232529] hover:bg-[#F5F7FB]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="space-y-4">
        <section className={section === "general" ? "space-y-3 rounded-xl border border-[#E7EAF1] bg-white p-4" : "hidden"}>
          <h2 className="text-sm font-semibold">General</h2>
          <Field name="slug" label="Slug" defaultValue={product?.slug} required />
          <Field name="brand" label="Brand" defaultValue={product?.brand} required />
          <Field name="artworkKey" label="Artwork key" defaultValue={product?.artworkKey ?? "digital"} />
          <label className="block text-sm">
            Category
            <select name="categoryId" defaultValue={product?.categoryId} className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-2 text-sm">
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Platform
            <select name="platformId" defaultValue={product?.platformId} className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-2 text-sm">
              {platforms.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Kind
            <select name="kind" defaultValue={product?.kind ?? "DIGITAL_CODE"} className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-2 text-sm">
              {["GIFT_CARD", "WALLET", "GAME_CURRENCY", "SUBSCRIPTION", "DIRECT_TOPUP", "DIGITAL_CODE"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Fulfillment
            <select name="fulfillmentType" defaultValue={product?.fulfillmentType ?? "CODE"} className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-2 text-sm">
              <option value="CODE">Digital code</option>
              <option value="DIRECT_TOPUP">Direct top-up</option>
            </select>
          </label>
        </section>
        <section className={section === "localization" ? "space-y-3 rounded-xl border border-[#E7EAF1] bg-white p-4" : "hidden"}>
          <h2 className="text-sm font-semibold">Localization</h2>
          <Field name="nameEn" label="Name (EN)" defaultValue={product?.nameEn} required />
          <Field name="nameAr" label="Name (AR)" defaultValue={product?.nameAr} required />
          <Area name="shortEn" label="Short description (EN)" defaultValue={product?.shortEn} />
          <Area name="shortAr" label="Short description (AR)" defaultValue={product?.shortAr} />
          <Area name="descriptionEn" label="Description (EN)" defaultValue={product?.descriptionEn} />
          <Area name="descriptionAr" label="Description (AR)" defaultValue={product?.descriptionAr} />
        </section>
        <section className={section === "delivery" ? "space-y-3 rounded-xl border border-[#E7EAF1] bg-white p-4" : "hidden"}>
          <h2 className="text-sm font-semibold">Redemption instructions</h2>
          <Area name="instructionsEn" label="Instructions (EN)" defaultValue={product?.instructionsEn} />
          <Area name="instructionsAr" label="Instructions (AR)" defaultValue={product?.instructionsAr} />
        </section>
        <section className={section === "seo" ? "space-y-3 rounded-xl border border-[#E7EAF1] bg-white p-4" : "hidden"}>
          <h2 className="text-sm font-semibold">SEO</h2>
          <Field name="seoTitle" label="SEO title" defaultValue={product?.seoTitle ?? ""} />
          <Area name="seoDescription" label="SEO description" defaultValue={product?.seoDescription ?? ""} />
        </section>
        <section className={section === "publishing" ? "space-y-3 rounded-xl border border-[#E7EAF1] bg-white p-4" : "hidden"}>
          <h2 className="text-sm font-semibold">Publishing</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="bestseller" defaultChecked={product?.bestseller} /> Bestseller</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="refundable" defaultChecked={product?.refundable} /> Refundable</label>
          {mode === "create" ? (
            <>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" /> Publish immediately</label>
              <div className="grid gap-3 md:grid-cols-2">
                <Field name="variantName" label="First variant name" defaultValue="Standard" />
                <Field name="variantSku" label="SKU" />
                <Field name="variantPriceJod" label="Selling price (JOD)" type="number" step="0.001" />
                <Field name="variantCostJod" label="Cost (JOD)" type="number" step="0.001" />
                <Field name="variantDenomination" label="Denomination" type="number" step="0.01" />
                <Field name="variantCurrency" label="Package currency" defaultValue="USD" />
              </div>
            </>
          ) : null}
        </section>
        <button className="h-9 rounded-lg bg-[#0040FD] px-4 text-sm font-semibold text-white">
          {mode === "create" ? "Create product" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-3 text-sm"
      />
    </label>
  );
}

function Area({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <textarea name={name} defaultValue={defaultValue} rows={4} className="mt-1 w-full rounded-lg border border-[#E7EAF1] px-3 py-2 text-sm" />
    </label>
  );
}
