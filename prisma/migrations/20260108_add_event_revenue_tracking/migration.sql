-- Add quoteId and totalRevenue fields to Event model
ALTER TABLE "Event" ADD COLUMN "quoteId" TEXT;
ALTER TABLE "Event" ADD COLUMN "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add foreign key constraint from Event to Quote
ALTER TABLE "Event" ADD CONSTRAINT "Event_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index on quoteId for faster lookups
CREATE INDEX "Event_quoteId_idx" ON "Event"("quoteId");

-- Create index on totalRevenue for analytics queries
CREATE INDEX "Event_totalRevenue_idx" ON "Event"("totalRevenue") WHERE "totalRevenue" > 0;
