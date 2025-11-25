/**
 * Migration script to move preferenceWeight from top-level to nested in feeding and pumping
 * Run with: infisical run -- tsx scripts/migrate-preference-weights.ts
 */

import { eq, isNotNull } from 'drizzle-orm';
import { db } from '../src/client';
import { Babies } from '../src/schema';
import type { BabyCustomPreferences } from '../src/types/baby-preferences';

async function migratePreferenceWeights() {
  console.log('Starting preference weight migration...');

  // Get all babies with customPreferences
  const babies = await db
    .select({
      customPreferences: Babies.customPreferences,
      id: Babies.id,
    })
    .from(Babies)
    .where(isNotNull(Babies.customPreferences));

  console.log(`Found ${babies.length} babies with customPreferences`);

  let migrated = 0;
  let skipped = 0;

  for (const baby of babies) {
    const prefs = baby.customPreferences as BabyCustomPreferences | null;

    if (!prefs || !prefs.preferenceWeight) {
      skipped++;
      continue;
    }

    // Check if already migrated
    if (
      prefs.feeding?.preferenceWeight !== undefined ||
      prefs.pumping?.preferenceWeight !== undefined
    ) {
      skipped++;
      continue;
    }

    // Migrate: copy top-level preferenceWeight to feeding and pumping
    const updatedPrefs: BabyCustomPreferences = {
      ...prefs,
      feeding: {
        ...prefs.feeding,
        preferenceWeight: prefs.preferenceWeight,
      },
      pumping: {
        ...prefs.pumping,
        preferenceWeight: prefs.preferenceWeight,
      },
      // Keep top-level for backward compatibility during transition
    };

    await db
      .update(Babies)
      .set({ customPreferences: updatedPrefs })
      .where(eq(Babies.id, baby.id));

    migrated++;
  }

  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped`);
}

migratePreferenceWeights()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
