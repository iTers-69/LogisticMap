import {
    meanBearing,
    movePoint,
    findFarthestVillage,
    toDeg
} from "../../tools/geoUtils.js";

/**
 * Дополняет ветку данными выезда, если они отсутствуют.
 * Сохранённый порядок сёл в villageIds не пересчитывается.
 */
export function enrichBranch(branch, hubCoords, villages, coordinates) {
    const villageIds = branch.villageIds ?? [];

    const villageList = villageIds
        .map(id => villages.find(v => String(v.id) === String(id)))
        .filter(Boolean);

    if (!villageList.length) return branch;

    const lastId = villageIds[villageIds.length - 1];
    const bearing = meanBearing(hubCoords, villageList, coordinates);
    const endVillage = villageList.find(v => String(v.kato) === String(branch.endPointKato))
        ?? findFarthestVillage(hubCoords, villageList, coordinates);

    return {
        ...branch,
        villageIds,
        exitPoint: branch.exitPoint ?? movePoint(hubCoords, bearing, 0.4),
        exitBearing: branch.exitBearing ?? Math.round(toDeg(bearing)),
        exitIndex: branch.exitIndex ?? 1,
        endPointKato: branch.endPointKato ?? endVillage?.kato ?? lastId ?? null,
        color: branch.color ?? "#e53935"
    };
}
