-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'REVIEWED', 'QUALIFIED', 'NOT_QUALIFIED', 'READY_FOR_OUTREACH', 'CONTACTED', 'REPLIED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "business_name" VARCHAR(160) NOT NULL,
    "industry" VARCHAR(120),
    "description" TEXT,
    "website_url" VARCHAR(2048),
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "address" VARCHAR(500),
    "google_maps_url" VARCHAR(2048),
    "instagram_url" VARCHAR(2048),
    "facebook_url" VARCHAR(2048),
    "linkedin_url" VARCHAR(2048),
    "source" VARCHAR(100),
    "source_reference" VARCHAR(255),
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "business_name_key" VARCHAR(160) NOT NULL,
    "website_key" VARCHAR(255),
    "email_key" VARCHAR(254),
    "phone_key" VARCHAR(40),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_contacts" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "job_title" VARCHAR(120),
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lead_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_history" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "from_status" "LeadStatus",
    "to_status" "LeadStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_status_archived_at_idx" ON "leads"("status", "archived_at");
CREATE INDEX "leads_priority_archived_at_idx" ON "leads"("priority", "archived_at");
CREATE INDEX "leads_business_name_key_idx" ON "leads"("business_name_key");
CREATE INDEX "leads_website_key_idx" ON "leads"("website_key");
CREATE INDEX "leads_email_key_idx" ON "leads"("email_key");
CREATE INDEX "leads_phone_key_idx" ON "leads"("phone_key");
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");
CREATE INDEX "lead_contacts_lead_id_idx" ON "lead_contacts"("lead_id");
CREATE INDEX "lead_status_history_lead_id_created_at_idx" ON "lead_status_history"("lead_id", "created_at");

-- AddForeignKey
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
