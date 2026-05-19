-- Extend the previously CDUT-only employment-insight cache to cover every
-- Sichuan "Double First-Class" university (四川双一流高校). The table name
-- is kept as `cdut_employment_records` to avoid a destructive rename; the
-- new `school` column carries the canonical school name and is indexed for
-- per-school lookups.
--
-- Existing rows are backfilled with 成都理工大学 because that is the only
-- school whose sources were ingested before this migration. Downstream
-- code treats NULL as "unknown" and a backfilled value as authoritative.

ALTER TABLE `cdut_employment_records`
  ADD COLUMN `school` VARCHAR(80) NULL COMMENT '学校名（四川双一流高校之一）' AFTER `id`;

UPDATE `cdut_employment_records`
   SET `school` = '成都理工大学'
 WHERE `school` IS NULL;

CREATE INDEX `idx_cdut_employment_school` ON `cdut_employment_records` (`school`);
