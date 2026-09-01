-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "artworkKind" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "mappedProductId" TEXT,
ADD COLUMN     "permissionNote" TEXT,
ADD COLUMN     "retrievedAt" TIMESTAMP(3),
ADD COLUMN     "sourcePageUrl" TEXT,
ADD COLUMN     "sourceUrl" TEXT;
