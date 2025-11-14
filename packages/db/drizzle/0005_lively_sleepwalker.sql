CREATE INDEX "familyMembers_userId_idx" ON "familyMembers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "familyMembers_familyId_idx" ON "familyMembers" USING btree ("familyId");