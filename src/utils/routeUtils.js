import getDistance from "../../tools/geoDistance.js";
import { bearingBetween } from "../../tools/geoUtils.js";

export function buildCumulativeDistances(coordinates) {
    const cumDist = [0];

    for (let i = 1; i < coordinates.length; i++) {
        const prev = coordinates[i - 1];
        const curr = coordinates[i];
        const seg = getDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        cumDist.push(cumDist[i - 1] + seg);
    }

    return cumDist;
}

export function interpolateAlongRoute(coordinates, cumDist, targetDist) {
    if (!coordinates.length) return null;
    if (targetDist <= 0) return { ...coordinates[0], bearing: 0 };

    const total = cumDist[cumDist.length - 1];
    if (targetDist >= total) {
        const last = coordinates[coordinates.length - 1];
        const prev = coordinates[coordinates.length - 2] ?? last;
        return { ...last, bearing: bearingBetween(prev, last) };
    }

    for (let i = 1; i < cumDist.length; i++) {
        if (cumDist[i] >= targetDist) {
            const segLen = cumDist[i] - cumDist[i - 1];
            const t = segLen > 0 ? (targetDist - cumDist[i - 1]) / segLen : 0;
            const from = coordinates[i - 1];
            const to = coordinates[i];

            return {
                lat: from.lat + (to.lat - from.lat) * t,
                lng: from.lng + (to.lng - from.lng) * t,
                bearing: bearingBetween(from, to)
            };
        }
    }

    return { ...coordinates[coordinates.length - 1], bearing: 0 };
}

export function toDeg(rad) {
    return rad * 180 / Math.PI;
}
