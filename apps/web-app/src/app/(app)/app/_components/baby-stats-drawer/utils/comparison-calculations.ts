import type { RealWorldComparisons } from '../types';

/**
 * Calculate fun real-world comparisons
 */
export function calculateRealWorldComparisons(
  totalDiapers: number,
  totalVolumeMl: number,
  totalSleepHours: number,
  totalActivities: number,
  totalVitaminD: number,
  totalWalks: number,
  totalNailTrimming: number,
  totalContrastTime: number,
): RealWorldComparisons {
  // Diaper comparisons
  let diaperComparison = '';
  if (totalDiapers >= 5000) {
    const elephants = (totalDiapers * 0.5) / 12000; // ~0.5 lbs per diaper, elephant = 12000 lbs
    diaperComparison = `As heavy as ${Math.round(elephants * 10) / 10} African elephants! 🐘`;
  } else if (totalDiapers >= 2000) {
    const cars = Math.round((totalDiapers * 0.5) / 3000); // Average car ~3000 lbs
    diaperComparison = `Heavier than ${cars} compact car${cars !== 1 ? 's' : ''}! 🚗`;
  } else if (totalDiapers >= 1000) {
    const polarBears = Math.round((totalDiapers * 0.5) / 1000); // Polar bear ~1000 lbs
    diaperComparison = `As heavy as ${polarBears} polar bear${polarBears !== 1 ? 's' : ''}! 🐻‍❄️`;
  } else if (totalDiapers >= 500) {
    const bowlingBalls = Math.round((totalDiapers * 0.5) / 16); // Bowling ball ~16 lbs
    diaperComparison = `That's ${bowlingBalls} bowling ball${bowlingBalls !== 1 ? 's' : ''} worth! 🎳`;
  } else if (totalDiapers >= 100) {
    const heightFeet = Math.round((totalDiapers * 0.5) / 12); // Stack height in feet
    diaperComparison = `Stacked ${heightFeet} feet high - taller than a giraffe! 🦒`;
  } else {
    diaperComparison = 'Building your diaper mountain! Keep it up! 💪';
  }

  // Milk comparisons
  let milkComparison = '';
  const totalOz = totalVolumeMl / 29.5735;
  const totalGallons = totalOz / 128;

  // Fun comparisons with real-world references
  // Lake Michigan = ~1.3 trillion gallons (for extreme cases)
  // Olympic pool = 660,000 gallons
  // Average bathtub = 40 gallons
  if (totalGallons >= 1000000) {
    // For truly massive amounts (1M+ gallons), compare to Lake Michigan
    const lakeMichiganRatio = (totalGallons / 1300000000000) * 100;
    if (lakeMichiganRatio >= 0.0001) {
      milkComparison = `That's ${lakeMichiganRatio.toFixed(4)}% of Lake Michigan! 🏞️`;
    } else {
      const olympicPools = Math.round(totalGallons / 660000); // Olympic pool = 660,000 gallons
      milkComparison = `Enough to fill ${olympicPools.toLocaleString()} Olympic swimming pool${olympicPools !== 1 ? 's' : ''}! 🏊`;
    }
  } else if (totalGallons >= 10000) {
    const bathtubs = Math.round(totalGallons / 40); // Average bathtub = 40 gallons
    milkComparison = `Enough to fill ${bathtubs.toLocaleString()} bathtub${bathtubs !== 1 ? 's' : ''}! 🛁`;
  } else if (totalGallons >= 1000) {
    const milkJugs = Math.round(totalGallons / 1); // 1 gallon milk jug
    milkComparison = `That's ${milkJugs.toLocaleString()} gallon milk jug${milkJugs !== 1 ? 's' : ''}! 🥛`;
  } else if (totalGallons >= 100) {
    const bottles = Math.round(totalOz / 4); // 4 oz baby bottle
    milkComparison = `That's ${bottles.toLocaleString()} baby bottle${bottles !== 1 ? 's' : ''}! 🍼`;
  } else if (totalGallons >= 1) {
    milkComparison = `Over ${Math.round(totalGallons * 10) / 10} gallons - every drop counts! 💧`;
  } else {
    milkComparison = 'Every drop counts! Building that milk supply! 💧';
  }

  // Sleep comparisons
  let sleepComparison = '';
  const fullDays = Math.floor(totalSleepHours / 24);

  if (fullDays >= 365) {
    const years = Math.round((fullDays / 365) * 10) / 10;
    sleepComparison = `That's ${years} year${years !== 1 ? 's' : ''} of sleep - a true sleep champion! 😴`;
  } else if (fullDays >= 100) {
    const months = Math.round((fullDays / 30) * 10) / 10;
    sleepComparison = `Over ${months} months of sleep - that's dedication! 🌙`;
  } else if (fullDays >= 30) {
    sleepComparison = 'A full month of sleep! Your baby is well-rested! 😴';
  } else if (fullDays >= 7) {
    sleepComparison = `Over ${fullDays} days of sleep - building healthy habits! 🌙`;
  } else if (totalSleepHours >= 24) {
    sleepComparison = 'Over a full day of sleep! Sweet dreams! 💤';
  } else {
    sleepComparison = `${Math.round(totalSleepHours)} hours of sweet dreams! 💤`;
  }

  // Activity comparisons
  let activityComparison = '';
  if (totalActivities >= 10000) {
    const marathons = Math.round(totalActivities / 26.2); // Marathon = 26.2 miles, using as metaphor
    activityComparison = `You've logged ${totalActivities.toLocaleString()} activities - that's ${marathons} marathon${marathons !== 1 ? 's' : ''} of dedication! 🏆`;
  } else if (totalActivities >= 5000) {
    activityComparison = `Over ${totalActivities.toLocaleString()} activities - you're a tracking legend! 🏅`;
  } else if (totalActivities >= 1000) {
    activityComparison = `${totalActivities.toLocaleString()} activities logged - that's incredible dedication! 🎯`;
  } else if (totalActivities >= 500) {
    activityComparison = `Halfway to 1000! You're on fire! 🔥`;
  } else if (totalActivities >= 100) {
    activityComparison =
      'Over 100 activities - building an amazing history! 📊';
  } else {
    activityComparison =
      'Building your tracking history - every moment counts! 📈';
  }

  // Vitamin D comparisons
  let vitaminDComparison = '';
  if (totalVitaminD >= 1095) {
    const years = Math.round((totalVitaminD / 365) * 10) / 10;
    vitaminDComparison = `${years} year${years !== 1 ? 's' : ''} of sunshine! That's ${totalVitaminD} doses! ☀️`;
  } else if (totalVitaminD >= 365) {
    vitaminDComparison = `A full year of sunshine! Plus ${totalVitaminD - 365} more doses! 🌞`;
  } else if (totalVitaminD >= 100) {
    const months = Math.round((totalVitaminD / 30) * 10) / 10;
    vitaminDComparison = `${months} months of daily vitamins - strong bones ahead! 💊`;
  } else if (totalVitaminD >= 30) {
    vitaminDComparison =
      'A full month of vitamin D! Your baby is getting stronger! 💪';
  } else if (totalVitaminD > 0) {
    vitaminDComparison = `${totalVitaminD} dose${totalVitaminD !== 1 ? 's' : ''} of sunshine! Keep it up! 🌞`;
  } else {
    vitaminDComparison = 'Start tracking vitamin D for healthy bones! 🦴';
  }

  // Walking comparisons
  let walksComparison = '';
  // Assuming average walk is ~0.5 miles
  const totalMiles = totalWalks * 0.5;

  if (totalMiles >= 24901) {
    // Earth's circumference = ~24,901 miles
    const earthLaps = Math.round((totalMiles / 24901) * 10) / 10;
    walksComparison = `You've walked ${earthLaps} time${earthLaps !== 1 ? 's' : ''} around the Earth! 🌍`;
  } else if (totalMiles >= 2400) {
    // Distance across USA = ~2400 miles
    const crossCountry = Math.round((totalMiles / 2400) * 10) / 10;
    walksComparison = `Enough to cross the USA ${crossCountry} time${crossCountry !== 1 ? 's' : ''}! 🗺️`;
  } else if (totalMiles >= 1000) {
    walksComparison = `Over 1000 miles of walks - that's incredible! 🚶‍♀️`;
  } else if (totalWalks >= 365) {
    walksComparison = `A full year of walks! That's dedication to fresh air! 🌳`;
  } else if (totalWalks >= 100) {
    const miles = Math.round(totalMiles);
    walksComparison = `Over 100 walks - that's ${miles} miles of adventures! 🌍`;
  } else if (totalWalks >= 30) {
    walksComparison = 'A month of walks! Building those leg muscles! 🦵';
  } else if (totalWalks > 0) {
    walksComparison = `${totalWalks} walk${totalWalks !== 1 ? 's' : ''} logged! Every step counts! 👣`;
  } else {
    walksComparison = 'Time for a walk? Fresh air is great! 🌤️';
  }

  // Nail trimming comparisons
  let nailTrimmingComparison = '';
  if (totalNailTrimming >= 520) {
    const years = Math.round((totalNailTrimming / 52) * 10) / 10; // ~weekly = 52 per year
    nailTrimmingComparison = `Over ${years} year${years !== 1 ? 's' : ''} of nail trims! That's ${totalNailTrimming} trims! ✂️`;
  } else if (totalNailTrimming >= 100) {
    const years = Math.round((totalNailTrimming / 52) * 10) / 10;
    nailTrimmingComparison = `Over 100 trims! That's ${years} year${years !== 1 ? 's' : ''} of keeping those nails neat! ✂️`;
  } else if (totalNailTrimming >= 52) {
    nailTrimmingComparison = 'A full year of nail trims! No scratches here! 🎯';
  } else if (totalNailTrimming >= 12) {
    const months = Math.round((totalNailTrimming / 4) * 10) / 10; // ~monthly = 4 per month
    nailTrimmingComparison = `Over ${months} months of perfect nails! 💅`;
  } else if (totalNailTrimming > 0) {
    nailTrimmingComparison = `${totalNailTrimming} nail trim${totalNailTrimming !== 1 ? 's' : ''}! Keeping those tiny fingers safe! 👶`;
  } else {
    nailTrimmingComparison = `Don't forget those tiny nails! ✂️`;
  }

  // Contrast time comparisons
  let contrastTimeComparison = '';
  if (totalContrastTime >= 1095) {
    const years = Math.round((totalContrastTime / 365) * 10) / 10;
    contrastTimeComparison = `${years} year${years !== 1 ? 's' : ''} of contrast time! That's amazing visual development! 👁️`;
  } else if (totalContrastTime >= 365) {
    contrastTimeComparison = `A full year of contrast time! That's incredible brain-building! 🧠`;
  } else if (totalContrastTime >= 100) {
    const months = Math.round((totalContrastTime / 30) * 10) / 10;
    contrastTimeComparison = `Over 100 sessions! That's ${months} months of brain-building! 🧠`;
  } else if (totalContrastTime >= 30) {
    contrastTimeComparison =
      'A full month of contrast time! Building those neural pathways! 🎨';
  } else if (totalContrastTime > 0) {
    contrastTimeComparison = `${totalContrastTime} contrast session${totalContrastTime !== 1 ? 's' : ''}! Great for development! 🌈`;
  } else {
    contrastTimeComparison = 'Try contrast time for visual development! 🎭';
  }

  return {
    activities: activityComparison,
    contrastTime: contrastTimeComparison,
    diaper: diaperComparison,
    milk: milkComparison,
    nailTrimming: nailTrimmingComparison,
    sleep: sleepComparison,
    vitaminD: vitaminDComparison,
    walks: walksComparison,
  };
}
