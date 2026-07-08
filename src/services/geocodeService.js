import hubCoordinates from "../data/hubCoordinates.js";
import { getHubKatoForRegion } from "./hubAssignmentService.js";
import { getDistanceKm } from "./coordinateValidationService.js";

export function buildSearchQueries(village) {
    const parts = village.fullName
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const region = parts[0] || "";
    const district = parts[1] || "";
    const city = parts[parts.length - 1] || "";

    const cleanCity = city
        .replace(/^г\./i, "")
        .replace(/^с\./i, "")
        .replace(/^п\./i, "")
        .trim();

    return [
        `${cleanCity}, ${district}, ${region}, Казахстан`,
        `${city}, ${district}, ${region}, Казахстан`,
        `${cleanCity}, ${region}, Казахстан`,
        `${city}, ${region}, Казахстан`,
        `${cleanCity}, Казахстан`
    ];
}

const NOMINATIM_BASE = typeof import.meta !== "undefined" && import.meta.env?.DEV
    ? "/nominatim"
    : "https://nominatim.openstreetmap.org";

const NOMINATIM_URL = `${NOMINATIM_BASE}/search`;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function geocodeVillage(village, options = {}) {
    const {
        maxDistanceKm = 350,
        delayMs = 1100
    } = options;

    const referenceHubKato = getHubKatoForRegion(village.fullName) ?? village.hubKato;
    const referenceHub = hubCoordinates[referenceHubKato];

    if (!referenceHub) {
        return { ok: false, error: "Хаб не найден" };
    }

    let bestPlace = null;
    let bestDistance = Infinity;
    const queries = buildSearchQueries(village);

    for (const search of queries) {
        try {
            const response = await fetch(
                `${NOMINATIM_URL}?q=${encodeURIComponent(search)}&format=jsonv2&limit=5&countrycodes=kz`,
                {
                    headers: {
                        "Accept-Language": "ru",
                        "User-Agent": "LogisticMap/1.0"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Nominatim ${response.status}`);
            }

            const results = await response.json();

            for (const place of results) {
                const distance = getDistanceKm(
                    referenceHub.lat,
                    referenceHub.lng,
                    Number(place.lat),
                    Number(place.lon)
                );

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestPlace = place;
                }
            }
        } catch (error) {
            console.warn("Geocode query failed:", search, error);
        }

        if (delayMs > 0) {
            await sleep(delayMs);
        }

        if (bestDistance < maxDistanceKm) {
            break;
        }
    }

    if (!bestPlace) {
        return { ok: false, error: "Не найдено в OpenStreetMap" };
    }

    if (bestDistance > maxDistanceKm) {
        return {
            ok: false,
            error: `Ближайший результат слишком далеко (${Math.round(bestDistance)} км)`
        };
    }

    return {
        ok: true,
        lat: Number(bestPlace.lat),
        lng: Number(bestPlace.lon),
        distanceKm: Math.round(bestDistance),
        displayName: bestPlace.display_name
    };
}

export async function geocodeVillagesBatch(villages, onProgress, options = {}) {
    const results = [];
    const delayBetween = options.delayBetweenMs ?? 1200;

    for (let i = 0; i < villages.length; i++) {
        const village = villages[i];
        onProgress?.({
            current: i + 1,
            total: villages.length,
            village,
            status: "geocoding"
        });

        const result = await geocodeVillage(village, options);

        results.push({ village, result });

        onProgress?.({
            current: i + 1,
            total: villages.length,
            village,
            status: "done",
            result
        });

        if (i < villages.length - 1 && delayBetween > 0) {
            await sleep(delayBetween);
        }
    }

    return results;
}
