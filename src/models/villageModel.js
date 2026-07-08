export function createVillage({

    kato,

    name,

    fullName,

    hubName,

    hubKato

}) {

    return {

        id: kato,

        kato,

        name,

        fullName,

        hubName,

        hubKato,

        lat: null,

        lng: null,

        branchId: null,

        logisticianId: null,

        routeOrder: null,

        isEdited: false

    };

}