-- Add optional deduplication identifier for batch-synced heartbeats
ALTER TABLE "Heartbeat"
ADD COLUMN "heartbeatId" TEXT;

-- Enforce uniqueness so batch imports cannot create duplicate heartbeats
CREATE UNIQUE INDEX "Heartbeat_heartbeatId_key" ON "Heartbeat"("heartbeatId");
