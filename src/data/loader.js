
const DATA_URL = "https://raw.communitydragon.org/latest/cdragon/tft/en_us.json";

export async function fetchTFTData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        return processData(data);
    } catch (error) {
        console.error("Error loading TFT data:", error);
        return null;
    }
}

function processData(rawData) {
    // Filter for Set 13 (or latest relevant set items)
    // The structure contains "items" and "sets".
    // We need champions and traits.
    // Inspection of raw.communitydragon.org usually shows "sets" object or flat "items".
    // Based on the chunk read earlier:
    // "items" contains augments, etc.
    // We need "sets" -> "13" -> "champions" / "traits"?
    // OR usually "setData" in "sets".

    // Let's assume the standard CommunityDragon structure for generic end_us.json:
    // It has { items: [...], sets: { ... } } or just a flat list of items/units?
    // The chunk showed "items": [ { apiName: "...", ... } ] which were augments.
    // We need to find units.

    const items = rawData.items || [];
    const setData = rawData.sets?.[13] || rawData.sets?.[Object.keys(rawData.sets).pop()]; // Fallback to latest

    // Actually, "en_us.json" is often a huge dump.
    // Units usually come from `sets[currentSet].champions`.
    // Traits from `sets[currentSet].traits`.

    // Let's rely on `sets` if available.
    let champions = [];
    let traits = [];

    // Attempt to find the latest set dynamically if not hardcoded to 13
    const setKeys = rawData.sets ? Object.keys(rawData.sets).map(Number).sort((a, b) => b - a) : [];
    const latestSetKey = setKeys[0];

    if (latestSetKey && rawData.sets[latestSetKey]) {
        const setObj = rawData.sets[latestSetKey];
        champions = setObj.champions || [];
        traits = setObj.traits || [];
    } else {
        // Fallback: search in items for anything with "TFTUnitProperty" or verify apiName `TFT13_...`
        // But standard cdragon en_us.json usually has `sets`.
        // If we looked at the chunk, we saw Augments.
        // We will assume `sets` structure is standard.
    }

    // Filter champions: Remove standard "TFT13_..." prefix if needed for display? 
    // Keep apiName for logic.
    // Need cost, traits.

    // Example Champion struct: { apiName: "TFT13_Jinx", traits: ["TFT13_Rebel", ...], cost: 5, ... }

    // Filter Traits: Identify Origins.
    // There is no explicit "isOrigin" flag in some data versions.
    // We might need a list of Origins vs Classes, or infer from icon/name logic?
    // Or manually list them? 
    // Actually, usually headers distinguish them in data, or we just treat all as traits.
    // PROMPT REQUEST: "maximize the amount of origins".
    // We need to distinguish Origins (Verticals usually) from Classes.
    // CommunityDragon traits often have `icon` content.
    // Heuristic: Origins often have "Hexcore" or specific icon paths? No.
    // User might need to toggle what is an origin?
    // Use a hardcoded list of known Origins for Set 13/Latest if deduction fails?
    // Set 13 "Into the Arcane"? Origins: Academy, Automata, Black Rose, Chem-Baron, Conqueror, Emissary, Enforcer, Experiment, Family, Firelight, High Roller, Ironclad, Junk Junker, Rebel, Scrap, Sniper (Class?), Watcher (Class?)...
    // Providing a manual mapping of API Name -> Type might be safest for "Ryze" focus.
    // Ryze traits: "TFT13_Wanderer" (Class?), "TFT13_Invoker"?
    // We need to look up Ryze specifically.

    return { champions, traits, setKey: latestSetKey };
}
