/** Максимум сёл в одной ветке до автоматического дробления пополам. */
export const MAX_VILLAGES_PER_BRANCH = 32;

/**
 * Рекомендуемое число секторов (выездов) по количеству сёл хаба.
 */
export function recommendSectorCount(villageCount) {
    if (villageCount <= 0) return 0;
    if (villageCount < 8) return 4;
    if (villageCount < 20) return 6;
    if (villageCount < 40) return 7;
    return Math.min(10, Math.max(8, Math.ceil(villageCount / 12)));
}

/**
 * Делит сёла хаба на секторы компаса — «лучи» от центра, как на схеме выездов.
 * Возвращает только непустые секторы.
 */
export default function splitByCompassSectors(
    hub,
    villages,
    coordinates,
    sectorCount = 8
) {
    if (!sectorCount || sectorCount < 1) return [];

    const sectorSize = (2 * Math.PI) / sectorCount;
    const groups = Array.from({ length: sectorCount }, (_, index) => ({
        sectorIndex: index,
        villages: []
    }));

    villages.forEach(village => {
        const point = coordinates[village.kato];
        if (!point) return;

        let angle = Math.atan2(
            point.lat - hub.lat,
            point.lng - hub.lng
        );

        if (angle < 0) angle += 2 * Math.PI;

        const sector = Math.min(
            Math.floor(angle / sectorSize),
            sectorCount - 1
        );

        groups[sector].villages.push(village);
    });

    return groups
        .filter(group => group.villages.length > 0)
        .map(group => group.villages);
}

export function sectorCenterBearing(sectorIndex, sectorCount) {
    const sectorSize = (2 * Math.PI) / sectorCount;
    return -Math.PI / 2 + (sectorIndex + 0.5) * sectorSize;
}

function bisectByAngle(hub, villages, coordinates) {
    const withAngle = villages
        .map(village => {
            const point = coordinates[village.kato];
            if (!point) return null;

            const angle = Math.atan2(
                point.lat - hub.lat,
                point.lng - hub.lng
            );

            return { village, angle };
        })
        .filter(Boolean)
        .sort((a, b) => a.angle - b.angle);

    const mid = Math.floor(withAngle.length / 2);
    return [
        withAngle.slice(0, mid).map(x => x.village),
        withAngle.slice(mid).map(x => x.village)
    ];
}

/**
 * Дробит слишком большие секторы ровно на два выезда (по углу от хаба).
 */
export function splitOversizedGroups(
    hub,
    groups,
    coordinates,
    maxSize = MAX_VILLAGES_PER_BRANCH
) {
    const result = [];

    for (const group of groups) {
        if (group.length <= maxSize) {
            result.push(group);
            continue;
        }

        result.push(...bisectByAngle(hub, group, coordinates));
    }

    return result;
}
