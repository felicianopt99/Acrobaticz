-- Add partnerId to Client for linking clients to agencies
ALTER TABLE "Client" ADD COLUMN "partnerId" TEXT;

-- Create index for partnerId
CREATE INDEX "Client_partnerId_idx" ON "Client"("partnerId");

-- Add foreign key for partnerId to Partner
ALTER TABLE "Client" ADD CONSTRAINT "Client_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
