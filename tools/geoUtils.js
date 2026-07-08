import getDistance from "./geoDistance.js";

export function toRad(deg) {
    return deg * Math.PI / 180;
}

export function toDeg(rad) {
    return rad * 180 / Math.PI;
}

export function meanBearing(origin, villages, coordinates) {
    const angles = villages
        .map(v => coordinates[v.kato])
        .filter(Boolean)
        .map(p => Math.atan2(p.lat - origin.lat, p.lng - origin.lng));

    if (!angles.length) return 0;

    const sinSum = angles.reduce((s, a) => s + Math.sin(a), 0);
    const cosSum = angles.reduce((s, a) => s + Math.cos(a), 0);

    return Math.atan2(sinSum, cosSum);
}

export function movePoint(origin, bearingRad, distanceKm) {
    const R = 6371;
    const lat1 = toRad(origin.lat);
    const lng1 = toRad(origin.lng);
    const angular = distanceKm / R;

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRad)
    );

    const lng2 = lng1 + Math.atan2(
        Math.sin(bearingRad) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
        lat: toDeg(lat2),
        lng: toDeg(lng2)
    };
}

export function projectionAlongBearing(origin, point, bearingRad) {
    const dx = point.lng - origin.lng;
    const dy = point.lat - origin.lat;
    const cos = Math.cos(bearingRad);
    const sin = Math.sin(bearingRad);
    return dx * cos + dy * sin;
}

export function findFarthestVillage(hub, villages, coordinates) {
    let farthest = null;
    let maxDist = -1;

    villages.forEach(village => {
        const point = coordinates[village.kato];
        if (!point) return;

        const dist = getDistance(hub.lat, hub.lng, point.lat, point.lng);
        if (dist > maxDist) {
            maxDist = dist;
            farthest = village;
        }
    });

    return farthest;
}

export function bearingBetween(from, to) {
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const dLng = toRad(to.lng - from.lng);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    return Math.atan2(y, x);
}
