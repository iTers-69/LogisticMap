export function createHub({

    kato,

    name

}) {

    return {

        id: kato,

        kato,

        name,

        lat: null,

        lng: null,

        branchCount: 0,
        
        villageCount: 0,

        logisticianCount: 0,

    };

}