import getDistance from "../../tools/geoDistance.js";
import twoOpt from "../services/twoOpt.js";

export default function optimizeRoute(
    hub,
    villages,
    coordinates
) {

    const remaining = [...villages];

    const result = [];

    let current = hub;

    while (remaining.length) {

        let nearestIndex = -1;
        let nearestDistance = Infinity;

        remaining.forEach((village, index) => {

            const point = coordinates[village.kato];

            if (!point) return;

            const d = getDistance(

                current.lat,
                current.lng,

                point.lat,
                point.lng

            );

            if (d < nearestDistance) {

                nearestDistance = d;
                nearestIndex = index;

            }

        });

        if (nearestIndex === -1)
            break;

        const nearest = remaining.splice(nearestIndex, 1)[0];

        result.push(nearest);

        current = coordinates[nearest.kato];

    }

    return twoOpt(
        result,
        hub,
        coordinates
    );

}