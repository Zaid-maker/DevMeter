-- DropForeignKey
ALTER TABLE "AnnouncementCampaignSend" DROP CONSTRAINT IF EXISTS "AnnouncementCampaignSend_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "AnnouncementCampaignSend";

-- DropEnum
DROP TYPE IF EXISTS "AnnouncementCampaignSendStatus";
