import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";
import { changeOrderFulfillment } from "@/server/actions/admin";
import { notFound } from "next/navigation";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin(PERMISSIONS.orderRead);
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { customerFields: true, digitalCodes: true, variant: true } },
      payments: { include: { events: true } },
      history: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[#616674]">Order</p>
        <h1 className="text-2xl font-semibold">{order.number}</h1>
        {order.isTest ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">Test order — not a customer delivery</p> : null}
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm">
          <p className="text-xs text-[#616674]">Payment</p>
          <p className="mt-1 font-semibold">{order.paymentStatus}</p>
        </article>
        <article className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm">
          <p className="text-xs text-[#616674]">Fulfillment</p>
          <p className="mt-1 font-semibold">{order.fulfillmentStatus}</p>
        </article>
        <article className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm">
          <p className="text-xs text-[#616674]">Total</p>
          <p className="mt-1 font-semibold">JOD {filsToJod(order.totalFils).toFixed(3)}</p>
        </article>
      </section>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Customer</h2>
        <p className="mt-2 text-sm">{order.fullName} · {order.email} · {order.phone}</p>
      </section>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Items</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="border-b border-[#E7EAF1] pb-2">
              <p className="font-medium">{item.name} × {item.quantity}</p>
              {item.customerFields.map((field) => (
                <p key={field.id} className="text-[#616674]">{field.label}: {field.maskedValue}</p>
              ))}
              {item.digitalCodes.map((code) => (
                <p key={code.id} className="text-[#616674]">Code: {code.masked}</p>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Timeline</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {order.history.map((event) => (
            <li key={event.id}>{event.field}: {event.fromValue ?? "—"} → {event.toValue} {event.reason ? `· ${event.reason}` : ""}</li>
          ))}
        </ul>
      </section>
      {user.role !== "VIEWER" ? (
        <form
          className="rounded-xl border border-[#E7EAF1] bg-white p-4"
          action={async (formData) => {
            "use server";
            await changeOrderFulfillment(id, formData.get("status") as "COMPLETED" | "FAILED" | "PROCESSING" | "CANCELLED", String(formData.get("reason") ?? ""));
          }}
        >
          <h2 className="text-sm font-semibold">Manual fulfillment change</h2>
          <select name="status" className="mt-3 h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <input name="reason" required placeholder="Reason" className="mt-3 h-9 w-full rounded-lg border border-[#E7EAF1] px-3 text-sm" />
          <button className="mt-3 h-9 rounded-lg bg-[#0040FD] px-3 text-sm font-semibold text-white">Update</button>
        </form>
      ) : null}
    </div>
  );
}
