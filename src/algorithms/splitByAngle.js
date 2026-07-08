export default function splitByAngle(
    hub,
    villages,
    coordinates,
    maxStops = 30
) {

    const withAngle = villages
        .map(village => {

            const point = coordinates[village.kato];

            if (!point) return null;

            const angle = Math.atan2(

                point.lat - hub.lat,

                point.lng - hub.lng

            );

            return {

                village,

                angle

            };

        })
        .filter(Boolean)
        .sort((a, b) => a.angle - b.angle);

    const branches = [];

    for (let i = 0; i < withAngle.length; i += maxStops) {

        branches.push(

            withAngle
                .slice(i, i + maxStops)
                .map(x => x.village)

        );

    }

    return branches;

}