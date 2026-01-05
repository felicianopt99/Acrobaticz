-- Add agencyId to Event for tracking events from agency partners
ALTER TABLE "Event" ADD COLUMN "agencyId" TEXT;

-- Create index for agencyId
CREATE INDEX "Event_agencyId_idx" ON "Event"("agencyId");

-- Add foreign key for agencyId to Partner
ALTER TABLE "Event" ADD CONSTRAINT "Event_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create junction table for Event sub-clients (many-to-many)
CREATE TABLE "EventSubClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "EventSubClient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventSubClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint to prevent duplicate sub-clients
CREATE UNIQUE INDEX "EventSubClient_eventId_clientId_key" ON "EventSubClient"("eventId", "clientId");

-- Create indexes for better query performance
CREATE INDEX "EventSubClient_eventId_idx" ON "EventSubClient"("eventId");
CREATE INDEX "EventSubClient_clientId_idx" ON "EventSubClient"("clientId");
