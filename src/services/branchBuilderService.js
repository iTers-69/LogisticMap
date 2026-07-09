import { createBranch } from "../models/branchModel.js";
import splitByCompassSectors, {
    recommendSectorCount,
    splitOversizedGroups
} from "../algorithms/splitByCompassSectors.js";
import orderAlongExit from "../algorithms/orderAlongExit.js";
import { meanBearing, movePoint, findFarthestVillage, toDeg } from "../../tools/geoUtils.js";

export const EXIT_COLORS = [
    "#8B1538", "#c62828", "#e53935", "#d84315",
    "#ef6c00", "#f57c00", "#ff8f00", "#ff6f00",
    "#bf360c", "#880e4f"
];

export function buildHubBranches(hub, hubVillages, hubCoords, coordinates, options = {}) {
    if (!hubCoords || !hubVillages.length) return [];

    const withCoords = hubVillages.filter(v => coordinates[v.kato]);
    if (!withCoords.length) return [];

    const sectorCount = options.sectorCount
        ?? recommendSectorCount(withCoords.length);

    const sectorGroups = splitByCompassSectors(
        hubCoords,
        withCoords,
        coordinates,
        sectorCount
    );

    const groups = splitOversizedGroups(
        hubCoords,
        sectorGroups,
        coordinates
    );

    return groups.map((group, index) => {
        const ordered = orderAlongExit(hubCoords, group, coordinates);
        const bearing = meanBearing(hubCoords, ordered, coordinates);
        const exitPoint = movePoint(hubCoords, bearing, 0.4);
        const endVillage = findFarthestVillage(hubCoords, ordered, coordinates);

        const branch = createBranch({
            id: `${hub.kato}-${index + 1}`,
            hubKato: hub.kato,
            name: `Ветка ${index + 1}`
        });

        branch.villageIds = ordered.map(v => v.id);
        branch.totalStops = ordered.length;
        branch.exitIndex = index + 1;
        branch.exitBearing = Math.round(toDeg(bearing));
        branch.exitPoint = exitPoint;
        branch.endPointKato = endVillage?.kato ?? null;
        branch.color = EXIT_COLORS[index % EXIT_COLORS.length];
        branch.manualRoute = true;

        return branch;
    });
}

export function buildAllHubBranches(hubs, villages, hubCoordinatesMap, coordinates) {
    const branches = [];

    hubs.forEach(hub => {
        const hubCoords = hubCoordinatesMap[hub.kato];
        if (!hubCoords) return;

        const hubVillages = villages.filter(v => v.hubKato === hub.kato);
        const hubBranches = buildHubBranches(
            hub,
            hubVillages,
            hubCoords,
            coordinates
        );

        branches.push(...hubBranches);
    });

    return branches;
}
