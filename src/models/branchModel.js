export function createBranch({

    id,

    hubKato,

    name

}) {

    return {

        id,

        hubKato,

        name,

        villageIds: [],

        logisticianId: null,

        totalDistance: 0,

        totalWeight: 0,

        totalStops: 0,

        color: null,

        exitIndex: null,

        exitBearing: null,

        exitPoint: null,

        endPointKato: null,

        isLocked: false,

        manualRoute: false

    };

}