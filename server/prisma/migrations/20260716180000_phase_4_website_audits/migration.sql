CREATE TYPE "WebsiteAuditStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "website_audits" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "status" "WebsiteAuditStatus" NOT NULL DEFAULT 'PENDING',
    "overall_score" INTEGER,
    "technical_score" INTEGER,
    "performance_score" INTEGER,
    "seo_score" INTEGER,
    "conversion_score" INTEGER,
    "mobile_score" INTEGER,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "problems" JSONB NOT NULL DEFAULT '[]',
    "recommended_actions" JSONB NOT NULL DEFAULT '[]',
    "raw_metrics" JSONB NOT NULL DEFAULT '{}',
    "failure_reason" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "website_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "website_audits_lead_id_created_at_idx" ON "website_audits"("lead_id", "created_at");
CREATE INDEX "website_audits_status_created_at_idx" ON "website_audits"("status", "created_at");
ALTER TABLE "website_audits" ADD CONSTRAINT "website_audits_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "website_audits" ADD CONSTRAINT "website_audits_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
