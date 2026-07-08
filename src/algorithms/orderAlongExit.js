import getDistance from "../../tools/geoDistance.js";
import { meanBearing, projectionAlongBearing } from "../../tools/geoUtils.js";

/**
 * Упорядочивает сёла вдоль выезда: от хаба к самой дальней точке Б.
 * Сортировка по проекции на направление выезда, затем по расстоянию.
 */
export default function orderAlongExit(hub, villages, coordinates) {
    if (villages.length <= 1) return [...villages];

    const bearing = meanBearing(hub, villages, coordinates);

    return [...villages].sort((a, b) => {
        const pointA = coordinates[a.kato];
        const pointB = coordinates[b.kato];
        if (!pointA || !pointB) return 0;

        const projA = projectionAlongBearing(hub, pointA, bearing);
        const projB = projectionAlongBearing(hub, pointB, bearing);

        if (Math.abs(projA - projB) > 1e-9) {
            return projA - projB;
        }

        const distA = getDistance(hub.lat, hub.lng, pointA.lat, pointA.lng);
        const distB = getDistance(hub.lat, hub.lng, pointB.lat, pointB.lng);
        return distA - distB;
    });
}
