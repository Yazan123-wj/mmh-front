import { importOneEpinImages } from "@/server/catalog/import-1epin-images";

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const summary = await importOneEpinImages({ dryRun });
  console.log(
    JSON.stringify(
      {
        dryRun: summary.dryRun,
        retrievedAt: summary.retrievedAt,
        catalogSource: summary.catalogSource,
        apiCredentials: summary.apiCredentials,
        backupPath: summary.backupPath,
        logPath: summary.logPath,
        products: summary.products,
      },
      null,
      2,
    ),
  );
  if (dryRun) {
    console.log("Dry run only. Re-run without --dry-run to download and attach 1Epin category artwork.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
