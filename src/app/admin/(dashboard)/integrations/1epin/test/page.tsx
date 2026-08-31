import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { forbidden } from "next/navigation";
import { prisma } from "@/server/db";
import { submitOneEpinTestOrder, checkOneEpinTestOrder } from "@/server/actions/oneepin";
import { revealDigitalCode } from "@/server/actions/admin";
import { decryptSecret } from "@/server/crypto/codes";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TestOrderConsolePage() {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  if (user.role !== "SUPER_ADMIN") forbidden();
  const supplier = await prisma.supplier.findFirst({
    where: { slug: "1epin" },
    include: {
      mappings: { orderBy: { name: "asc" } },
      supplierOrders: { where: { isTest: true }, take: 20, orderBy: { createdAt: "desc" }, include: { order: { include: { items: { include: { digitalCodes: true } } } } } },
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">Test mode</p>
      <h1 className="text-2xl font-semibold">1Epin test-order console</h1>
      <p className="max-w-2xl rounded-xl border border-[#F59E0B]/40 bg-white p-4 text-sm text-[#232529]">
        This console sends orders only to the 1Epin test endpoint. It must not be used with real player accounts.
      </p>
      <form
        action={async (formData) => {
          "use server";
          await submitOneEpinTestOrder(formData);
        }}
        className="grid max-w-xl gap-2 rounded-xl border border-[#E7EAF1] bg-white p-4"
      >
        <label className="text-sm">
          Supplier product
          <select name="productId" required className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-2 text-sm">
            {(supplier?.mappings ?? []).map((item) => (
              <option key={item.id} value={item.externalProductId}>
                {item.externalProductId} · {item.name} · {item.categoryType}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">Quantity<input name="quantity" type="number" min={1} defaultValue={1} className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-3 text-sm" /></label>
        <label className="text-sm">Test user/player field<input name="userField" placeholder="test" className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-3 text-sm" /></label>
        <label className="text-sm">Barem (tiered products only)<input name="barem" className="mt-1 h-9 w-full rounded-lg border border-[#E7EAF1] px-3 text-sm" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" required /> I confirm this is a 1Epin test-endpoint order</label>
        <button className="h-9 rounded-lg bg-[#0040FD] text-sm font-semibold text-white">Submit test order</button>
      </form>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Recent test orders</h2>
        <ul className="mt-2 space-y-3 text-sm">
          {supplier?.supplierOrders.map((item) => (
            <li key={item.id} className="border-b border-[#E7EAF1] pb-2">
              <p className="font-medium">{item.supplierRef} · {item.status}</p>
              <p className="text-[#616674]">{item.order.number} · {item.orderStatusMessage ?? item.message ?? "—"}</p>
              {item.order.items.flatMap((line) => line.digitalCodes).map((code) => (
                <p key={code.id} className="text-[#616674]">
                  PIN {code.revealedAt && code.isTest
                    ? decryptSecret({ ciphertext: code.ciphertext, iv: code.iv, authTag: code.authTag })
                    : code.masked}
                </p>
              ))}
              <form action={async () => { "use server"; await checkOneEpinTestOrder(item.supplierRef); }}>
                <button className="text-xs text-[#0040FD]">Check status</button>
              </form>
              {item.order.items.flatMap((line) => line.digitalCodes).map((code) => (
                <form key={`reveal-${code.id}`} action={async () => { "use server"; await revealDigitalCode(code.id); }}>
                  <button className="text-xs text-[#0040FD]">Reveal (audited)</button>
                </form>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <Link href="/admin/integrations/1epin" className="text-sm text-[#0040FD]">Back to integration</Link>
    </div>
  );
}
