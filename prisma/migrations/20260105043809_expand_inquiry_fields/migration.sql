/*
  Warnings:

  - You are about to drop the column `message` on the `CatalogShareInquiry` table. All the data in the column will be lost.
  - Added the required column `eventLocation` to the `CatalogShareInquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventName` to the `CatalogShareInquiry` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerPhone` on table `CatalogShareInquiry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CatalogShareInquiry" DROP COLUMN "message",
ADD COLUMN     "breakdownDateTime" TIMESTAMP(3),
ADD COLUMN     "budget" TEXT,
ADD COLUMN     "customerCompany" TEXT,
ADD COLUMN     "deliveryLocation" TEXT,
ADD COLUMN     "eventLocation" TEXT NOT NULL,
ADD COLUMN     "eventName" TEXT NOT NULL,
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "setupDateTime" TIMESTAMP(3),
ADD COLUMN     "specialRequirements" TEXT,
ALTER COLUMN "customerPhone" SET NOT NULL;
