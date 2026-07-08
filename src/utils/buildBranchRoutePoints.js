import { enrichBranch } from "./branchUtils.js";

/**
 * Точки маршрута ветки: выезд → все сёла по порядку.
 */
export function buildBranchRoutePoints(branch, hubCoords, villages, coordinates) {
    const enriched = enrichBranch(branch, hubCoords, villages, coordinates);
    const start = enriched.exitPoint ?? hubCoords;

    if (!start) return null;

    const points = [{ lat: start.lat, lng: start.lng }];

    (enriched.villageIds ?? []).forEach(id => {
        const coords = coordinates[id] ?? coordinates[String(id)];
        if (coords) {
            points.push({ lat: coords.lat, lng: coords.lng });
        }
    });

    return points.length >= 2 ? points : null;
}

export function pointsToLatLngArray(points) {
    return points.map(p => [p.lat, p.lng]);
}
