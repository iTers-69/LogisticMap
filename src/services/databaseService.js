export function createDatabase(data) {

    return {

        version: 1,

        createdAt: new Date().toISOString(),

        hubs: data.hubs,

        branches: data.branches,

        villages: data.villages,

        logisticians: []

    };

}