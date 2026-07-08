function routeDistance(route, hubCoords, villageCoordinates) {

    let total = 0;

    let prev = hubCoords;

    for (const village of route) {

        const curr = villageCoordinates[village.kato];

        total += distance(prev, curr);

        prev = curr;
    }

    total += distance(prev, hubCoords);

    return total;
}

function distance(a, b) {

    const dx = a.lng - b.lng;
    const dy = a.lat - b.lat;

    return Math.sqrt(dx * dx + dy * dy);
}

export default function twoOpt(route, hubCoords, villageCoordinates) {

    let improved = true;

    while (improved) {

        improved = false;

        for (let i = 1; i < route.length - 2; i++) {

            for (let k = i + 1; k < route.length - 1; k++) {

                const newRoute = [

                    ...route.slice(0, i),

                    ...route.slice(i, k + 1).reverse(),

                    ...route.slice(k + 1)

                ];

                if (

                    routeDistance(newRoute, hubCoords, villageCoordinates)

                    <

                    routeDistance(route, hubCoords, villageCoordinates)

                ) {

                    route = newRoute;

                    improved = true;

                }

            }

        }

    }

    return route;

}