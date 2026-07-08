import baseCoordinates from "../data/villageCoordinates.json";

export function resolveVillageCoord(kato, overrides = {}) {
    if (!kato) return null;
    const key = String(kato);
    return overrides[key] ?? baseCoordinates[key] ?? null;
}

export function hasBaseVillageCoord(kato) {
    return Boolean(baseCoordinates[String(kato)]);
}

export function isCoordOverridden(kato, overrides = {}) {
    return Boolean(overrides[String(kato)]);
}

export { baseCoordinates };
