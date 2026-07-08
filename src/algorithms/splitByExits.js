/**
 * Разбивает сёла хаба на группы по «выездам» —
 * ищет большие угловые разрывы между соседними направлениями.
 */
export default function splitByExits(
    hub,
    villages,
    coordinates,
    minGapDeg = 25
) {
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

    const n = withAngle.length;
    if (n === 0) return [];
    if (n === 1) return [[withAngle[0].village]];

    const minGap = minGapDeg * Math.PI / 180;
    const splitAfter = new Set();

    for (let i = 0; i < n - 1; i++) {
        const gap = withAngle[i + 1].angle - withAngle[i].angle;
        if (gap >= minGap) splitAfter.add(i);
    }

    const wrapGap = (withAngle[0].angle + 2 * Math.PI) - withAngle[n - 1].angle;
    if (wrapGap >= minGap) splitAfter.add(n - 1);

    if (splitAfter.size === 0) {
        return [withAngle.map(x => x.village)];
    }

    const groups = [];
    let current = [];

    for (let i = 0; i < n; i++) {
        current.push(withAngle[i].village);
        if (splitAfter.has(i)) {
            groups.push(current);
            current = [];
        }
    }

    if (current.length) groups.push(current);

    return groups;
}
