ALTER TABLE "parent_check_ins" RENAME TO "parentCheckIns";--> statement-breakpoint
ALTER TABLE "parent_tasks" RENAME TO "parentTasks";--> statement-breakpoint
ALTER TABLE "wellness_assessments" RENAME TO "wellnessAssessments";--> statement-breakpoint
ALTER TABLE "parentCheckIns" DROP CONSTRAINT "parent_check_ins_familyId_families_id_fk";
--> statement-breakpoint
ALTER TABLE "parentCheckIns" DROP CONSTRAINT "parent_check_ins_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "parentTasks" DROP CONSTRAINT "parent_tasks_familyId_families_id_fk";
--> statement-breakpoint
ALTER TABLE "parentTasks" DROP CONSTRAINT "parent_tasks_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "wellnessAssessments" DROP CONSTRAINT "wellness_assessments_familyId_families_id_fk";
--> statement-breakpoint
ALTER TABLE "wellnessAssessments" DROP CONSTRAINT "wellness_assessments_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "parent_check_ins_date_idx";--> statement-breakpoint
DROP INDEX "parent_check_ins_family_idx";--> statement-breakpoint
DROP INDEX "parent_check_ins_user_idx";--> statement-breakpoint
DROP INDEX "parent_tasks_completed_idx";--> statement-breakpoint
DROP INDEX "parent_tasks_family_idx";--> statement-breakpoint
DROP INDEX "parent_tasks_generated_date_idx";--> statement-breakpoint
DROP INDEX "parent_tasks_user_idx";--> statement-breakpoint
DROP INDEX "wellness_assessments_date_idx";--> statement-breakpoint
DROP INDEX "wellness_assessments_family_idx";--> statement-breakpoint
DROP INDEX "wellness_assessments_risk_score_idx";--> statement-breakpoint
DROP INDEX "wellness_assessments_user_idx";--> statement-breakpoint
ALTER TABLE "parentCheckIns" ADD CONSTRAINT "parentCheckIns_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentCheckIns" ADD CONSTRAINT "parentCheckIns_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentTasks" ADD CONSTRAINT "parentTasks_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parentTasks" ADD CONSTRAINT "parentTasks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellnessAssessments" ADD CONSTRAINT "wellnessAssessments_familyId_families_id_fk" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellnessAssessments" ADD CONSTRAINT "wellnessAssessments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parentCheckIns_date_idx" ON "parentCheckIns" USING btree ("date");--> statement-breakpoint
CREATE INDEX "parentCheckIns_family_idx" ON "parentCheckIns" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "parentCheckIns_user_idx" ON "parentCheckIns" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "parentTasks_completed_idx" ON "parentTasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "parentTasks_family_idx" ON "parentTasks" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "parentTasks_generated_date_idx" ON "parentTasks" USING btree ("generatedDate");--> statement-breakpoint
CREATE INDEX "parentTasks_user_idx" ON "parentTasks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wellnessAssessments_date_idx" ON "wellnessAssessments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "wellnessAssessments_family_idx" ON "wellnessAssessments" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "wellnessAssessments_risk_score_idx" ON "wellnessAssessments" USING btree ("riskScore");--> statement-breakpoint
CREATE INDEX "wellnessAssessments_user_idx" ON "wellnessAssessments" USING btree ("userId");