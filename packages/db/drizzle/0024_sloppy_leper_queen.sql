CREATE INDEX "activities_babyId_startTime_isScheduled_idx" ON "activities" USING btree ("babyId","startTime","isScheduled");--> statement-breakpoint
CREATE INDEX "activities_startTime_idx" ON "activities" USING btree ("startTime");--> statement-breakpoint
CREATE INDEX "activities_userId_idx" ON "activities" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activities_familyId_idx" ON "activities" USING btree ("familyId");--> statement-breakpoint
CREATE INDEX "babies_familyId_updatedAt_idx" ON "babies" USING btree ("familyId","updatedAt");--> statement-breakpoint
CREATE INDEX "celebrationMemories_babyId_celebrationType_idx" ON "celebrationMemories" USING btree ("babyId","celebrationType");--> statement-breakpoint
CREATE INDEX "milestones_babyId_achievedDate_idx" ON "milestones" USING btree ("babyId","achievedDate");--> statement-breakpoint
CREATE INDEX "milestones_babyId_isSuggested_idx" ON "milestones" USING btree ("babyId","isSuggested");--> statement-breakpoint
CREATE INDEX "milestones_familyId_idx" ON "milestones" USING btree ("familyId");