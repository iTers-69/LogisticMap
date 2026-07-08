import hubCoordinates from "../data/hubCoordinates.js";
import { getRegionFromFullName, getHubKatoForRegion } from "./hubAssignmentService.js";

export const KZ_BOUNDS = {
    minLat: 40.5,
    maxLat: 55.6,
    minLng: 46.0,
    maxLng: 87.5
};

export const MAX_REGION_DISTANCE_KM = 450;
export const CRITICAL_REGION_DISTANCE_KM = 550;

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideKazakhstan(lat, lng) {
    return lat >= KZ_BOUNDS.minLat && lat <= KZ_BOUNDS.maxLat
        && lng >= KZ_BOUNDS.minLng && lng <= KZ_BOUNDS.maxLng;
}

export function getReferenceHubKato(village) {
    return getHubKatoForRegion(village.fullName) ?? village.hubKato;
}

export function getReferenceHubCoords(village) {
    const kato = getReferenceHubKato(village);
    return hubCoordinates[kato] ?? null;
}

export function resolveCoordForValidation(kato, overrides = {}, baseCoordinates = {}) {
    if (!kato) return null;
    const key = String(kato);
    return overrides[key] ?? baseCoordinates[key] ?? null;
}

function buildIssue(village, type, severity, message, extra = {}) {
    return {
        kato: village.kato,
        name: village.name,
        region: getRegionFromFullName(village.fullName),
        hubName: village.hubName,
        type,
        severity,
        message,
        ...extra
    };
}

export function getCoordinateIssueForVillage(village, overrides = {}, duplicateKeys = null, baseCoordinates = {}) {
    const coords = resolveCoordForValidation(village.kato, overrides, baseCoordinates);

    if (!coords) {
        return buildIssue(
            village,
            "missing",
            "critical",
            "Координаты не заданы"
        );
    }

    const { lat, lng } = coords;

    if (!isInsideKazakhstan(lat, lng)) {
        return buildIssue(
            village,
            "outside_kz",
            "critical",
            "Точка за пределами Казахстана",
            { lat, lng }
        );
    }

    if (duplicateKeys) {
        const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
        if (duplicateKeys.has(key) && duplicateKeys.get(key).length > 1) {
            return buildIssue(
                village,
                "duplicate",
                "warning",
                "Координаты совпадают с другим селом",
                { lat, lng }
            );
        }
    }

    const referenceHub = getReferenceHubCoords(village);
    if (!referenceHub) return null;

    const distanceKm = Math.round(haversineKm(lat, lng, referenceHub.lat, referenceHub.lng));

    if (distanceKm > CRITICAL_REGION_DISTANCE_KM) {
        return buildIssue(
            village,
            "far_from_region",
            "critical",
            `Слишком далеко от области (${distanceKm} км)`,
            { distanceKm, lat, lng }
        );
    }

    if (distanceKm > MAX_REGION_DISTANCE_KM) {
        return buildIssue(
            village,
            "far_from_region",
            "warning",
            `Далеко от области (${distanceKm} км)`,
            { distanceKm, lat, lng }
        );
    }

    return null;
}

export function getCoordinateIssues(villages, overrides = {}, baseCoordinates = {}) {
    const coordKeys = new Map();

    (villages ?? []).forEach(village => {
        const coords = resolveCoordForValidation(village.kato, overrides, baseCoordinates);
        if (!coords) return;
        const key = `${Number(coords.lat).toFixed(4)},${Number(coords.lng).toFixed(4)}`;
        if (!coordKeys.has(key)) coordKeys.set(key, []);
        coordKeys.get(key).push(String(village.kato));
    });

    return (villages ?? [])
        .map(village => getCoordinateIssueForVillage(village, overrides, coordKeys, baseCoordinates))
        .filter(Boolean)
        .sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
}

export function getCoordinateIssueMap(villages, overrides = {}, baseCoordinates = {}) {
    const map = new Map();
    getCoordinateIssues(villages, overrides, baseCoordinates).forEach(issue => {
        map.set(String(issue.kato), issue);
    });
    return map;
}

export { haversineKm as getDistanceKm };
