
// User-defined strict list of Origins for Ryze
export const VALID_ORIGINS = new Set([
    "Bilgewater", "Demacia", "Freljord", "Ionia", "Ixtal", "Noxus",
    "Piltover", "Shadow Isles", "Shurima", "Targon", "Void", "Yordle", "Zaun"
]);

export function findTopComps(data, teamSize, ownedEmblems = {}) {
    const { champions, traits } = data;

    // 1. Find Ryze
    const ryze = champions.find(c => c.apiName && c.apiName.toLowerCase().includes("ryze"));
    if (!ryze) return [];

    // Filter pool: Exclude Ryze and Unique/Uncollectible units
    const pool = champions.filter(c => c !== ryze && c.cost > 0 && isStandardUnit(c));

    // 2. Optimization Loop
    const COMP_COUNT = 5;
    let bestComps = [];

    const ITERATIONS = 2500;
    const STEPS = 200;

    for (let i = 0; i < ITERATIONS; i++) {
        // Random Start
        let currentTeam = [ryze, ...getRandomSubarray(pool, teamSize - 1)];
        let currentScore = scoreTeam(currentTeam, traits, ownedEmblems);

        // Hill Climb
        for (let s = 0; s < STEPS; s++) {
            const swapIndex = Math.floor(Math.random() * (teamSize - 1)) + 1;
            const newUnit = pool[Math.floor(Math.random() * pool.length)];

            if (currentTeam.includes(newUnit)) continue;

            const newTeam = [...currentTeam];
            newTeam[swapIndex] = newUnit;

            const newScore = scoreTeam(newTeam, traits, ownedEmblems);
            if (newScore > currentScore) {
                currentTeam = newTeam;
                currentScore = newScore;
            }
        }

        bestComps.push({ team: currentTeam, score: currentScore, details: getTraitDetails(currentTeam, traits, ownedEmblems) });
    }

    // 3. Emblem Focus Pass (Logic Restored)
    let emblemComp = null;
    // Only run if we actually have emblems
    const emblemKeys = Object.keys(ownedEmblems).filter(k => ownedEmblems[k] > 0);

    if (emblemKeys.length > 0) {
        let bestEmblemScore = -Infinity;

        for (let i = 0; i < ITERATIONS; i++) {
            let currentTeam = [ryze, ...getRandomSubarray(pool, teamSize - 1)];
            let currentScore = scoreEmblemComp(currentTeam, traits, ownedEmblems);

            for (let s = 0; s < STEPS; s++) {
                const swapIndex = Math.floor(Math.random() * (teamSize - 1)) + 1;
                const newUnit = pool[Math.floor(Math.random() * pool.length)];
                if (currentTeam.includes(newUnit)) continue;

                const newTeam = [...currentTeam];
                newTeam[swapIndex] = newUnit;
                const newScore = scoreEmblemComp(newTeam, traits, ownedEmblems);

                if (newScore > currentScore) {
                    currentTeam = newTeam;
                    currentScore = newScore;
                }
            }

            if (currentScore > bestEmblemScore) {
                bestEmblemScore = currentScore;
                emblemComp = {
                    team: currentTeam,
                    score: currentScore,
                    details: getTraitDetails(currentTeam, traits, ownedEmblems),
                    isEmblemComp: true
                };
            }
        }
    }

    // Deduplicate and Sort
    const uniqueComps = [];
    const seen = new Set();

    bestComps.sort((a, b) => b.score - a.score);

    for (const comp of bestComps) {
        const key = comp.team.map(c => c.apiName).sort().join("|");
        if (!seen.has(key)) {
            seen.add(key);
            uniqueComps.push(comp);
        }
    }

    const finalResults = uniqueComps.slice(0, COMP_COUNT);

    // Append Emblem Comp if valid
    if (emblemComp) {
        // Avoid exact duplicate logic if needed, but "Bonus Option" is fine to be duplicate visually
        // just to confirm "this is what you get".
        finalResults.push(emblemComp);
    }

    return finalResults;
}

function scoreTeam(team, allTraits, ownedEmblems) {
    const activeData = getTraitDetails(team, allTraits, ownedEmblems);
    return (activeData.activeOrigins * 10000) + (activeData.activeCount * 100) + (activeData.totalCost * 0.1);
}

function scoreEmblemComp(team, allTraits, ownedEmblems) {
    const details = getTraitDetails(team, allTraits, ownedEmblems);
    let emblemScore = 0;

    // Huge bonus for using owned emblems in active traits
    for (const [trait, count] of Object.entries(ownedEmblems)) {
        if (!count) continue;
        const active = details.activatedTraits.find(t => t.name === trait);
        if (active) {
            emblemScore += 100000;
            emblemScore += (active.count * 100);
        }
    }

    return emblemScore + (details.activeOrigins * 1000) + (details.activeCount * 10);
}

function getTraitDetails(team, allTraits, ownedEmblems) {
    const counts = {};
    let totalCost = 0;

    // Tally traits from unique units
    const seenUnits = new Set();
    const uniqueUnitsList = [];

    for (const unit of team) {
        if (!seenUnits.has(unit.apiName)) {
            seenUnits.add(unit.apiName);
            uniqueUnitsList.push(unit);
            totalCost += unit.cost || 0;
        }
    }

    for (const unit of uniqueUnitsList) {
        if (!unit.traits) continue;
        for (const traitName of unit.traits) {
            counts[traitName] = (counts[traitName] || 0) + 1;
        }
    }

    for (const [trait, count] of Object.entries(ownedEmblems)) {
        counts[trait] = (counts[trait] || 0) + count;
    }

    let activeCount = 0;
    let activeOrigins = 0;
    let totalTiers = 0;
    const activatedTraits = [];

    for (const traitName in counts) {
        const count = counts[traitName];
        const traitData = allTraits.find(t => t.apiName === traitName || t.name === traitName);

        if (!traitData || !traitData.effects) continue;

        const sortedEffects = traitData.effects.sort((a, b) => b.minUnits - a.minUnits);
        let tier = 0;
        for (const effect of sortedEffects) {
            if (count >= effect.minUnits) {
                tier = 1;
                break;
            }
        }

        if (tier > 0) {
            const isUnique = sortedEffects.length === 1 && sortedEffects[0].minUnits === 1;
            const isOrigin = VALID_ORIGINS.has(traitData.name);

            if (isUnique && !isOrigin) {
                // Ignored
            } else {
                activeCount++;
                totalTiers += tier;
                if (isOrigin) {
                    activeOrigins++;
                }
            }

            activatedTraits.push({
                name: traitData.name || traitName,
                count,
                isOrigin: isOrigin,
                icon: traitData.icon
            });
        }
    }

    return { activeCount, activeOrigins, totalTiers, totalCost, activatedTraits };
}

function isStandardUnit(unit) {
    return unit.traits && unit.traits.length > 0;
}

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}
