const geoCache = new Map();

export function getCoordinates(kato) {
    return geoCache.get(String(kato)) ?? null;
}

export function setCoordinates(kato, lat, lng) {

    geoCache.set(String(kato), {
        lat,
        lng
    });

}

export function hasCoordinates(kato) {
    return geoCache.has(String(kato));
}

export function clearCache() {
    geoCache.clear();
}

export function getAllCoordinates() {
    return [...geoCache.entries()];
}