import { CustomerAccount } from "@/components/account/customer-account";
import { requireCustomer } from "@/server/auth/require-customer";
import { prisma } from "@/server/db";
import { loadCustomerOrders } from "@/server/orders/customer";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const sessionUser = await requireCustomer();
  const [user, orders] = await Promise.all([prisma.user.findUnique({ where: { id: sessionUser.id }, include: { customer: true } }), loadCustomerOrders(sessionUser.id)]);
  if (!user) return null;
  return <CustomerAccount profile={{ name: user.name ?? user.email, email: user.email, phone: user.customer?.phone ?? "" }} orders={orders} />;
}
