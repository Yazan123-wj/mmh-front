import { enrichCatalog } from "@/server/catalog/enrich";

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const summary = await enrichCatalog({ dryRun });
  const printable = {
    dryRun: summary.dryRun,
    retrievedAt: summary.retrievedAt,
    supplierCatalog: summary.supplierCatalog,
    backupPath: summary.backupPath,
    logPath: summary.logPath,
    products: summary.products.map((item) => ({
      id: item.productId,
      slug: item.slug,
      action: item.action,
      copy: item.copy,
      artwork: item.artwork,
      preservePrices: item.preservePrices,
      notes: item.notes,
    })),
  };
  console.log(JSON.stringify(printable, null, 2));
  if (dryRun) {
    console.log("Dry run only. Re-run without --dry-run to apply copy and identification tiles.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
