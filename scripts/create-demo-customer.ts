import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const prisma = new PrismaClient();
  const email = "demo@mmh.local";
  const password = "DemoCustomer1!";
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, kind: "CUSTOMER", disabled: false, name: "Demo Customer" },
    create: {
      email,
      name: "Demo Customer",
      kind: "CUSTOMER",
      passwordHash,
      customer: { create: { phone: "+962791234567" } },
    },
  });
  await prisma.customerProfile.upsert({
    where: { userId: user.id },
    update: { phone: "+962791234567" },
    create: { userId: user.id, phone: "+962791234567" },
  });
  console.log(`Created storefront login: ${user.email}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
