import { redirect } from "next/navigation";

export default function CatalogNewRedirect() {
  redirect("/admin/products/new");
}
