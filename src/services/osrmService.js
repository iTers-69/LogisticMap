import polyline from "@mapbox/polyline";

const OSRM_BASE =
    import.meta.env.VITE_OSRM_URL
    || "https://router.project-osrm.org/route/v1/driving";
const MAX_WAYPOINTS = 12;

async function fetchOsrmRoute(coordinates) {
    const url = `${OSRM_BASE}/${coordinates}?overview=full&geometries=polyline`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;

    return data.routes[0];
}

function pointsToOsrmString(points) {
    return points.map(p => `${p.lng},${p.lat}`).join(";");
}

function decodeRoute(route) {
    return polyline
        .decode(route.geometry)
        .map(([lat, lng]) => ({ lat, lng }));
}

function mergePolylines(segments) {
    const result = [];

    segments.forEach((segment, index) => {
        if (!segment.length) return;
        if (index === 0) {
            result.push(...segment);
        } else {
            result.push(...segment.slice(1));
        }
    });

    return result;
}

export async function getRoadRoute(points) {
    const details = await getRoadRouteDetails(points);
    return details?.coordinates ?? [];
}

export async function getRoadRouteDetails(points) {
    if (points.length < 2) return null;

    if (points.length <= MAX_WAYPOINTS) {
        return fetchSingleRoute(points);
    }

    const segments = [];
    let totalDistance = 0;
    let totalDuration = 0;

    let i = 0;
    while (i < points.length - 1) {
        const end = Math.min(i + MAX_WAYPOINTS - 1, points.length - 1);
        const chunk = points.slice(i, end + 1);

        const result = await fetchSingleRoute(chunk);
        if (!result) return null;

        segments.push(result.coordinates);
        totalDistance += result.distance;
        totalDuration += result.duration;

        i = end;
    }

    return {
        coordinates: mergePolylines(segments),
        distance: totalDistance,
        duration: totalDuration
    };
}

async function fetchSingleRoute(points) {
    const route = await fetchOsrmRoute(pointsToOsrmString(points));
    if (!route) return null;

    return {
        coordinates: decodeRoute(route),
        distance: route.distance,
        duration: route.duration
    };
}
