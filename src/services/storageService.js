const STORAGE_KEY = "logisticMapData";

export function saveData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}

export function loadData() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return null;

    const parsed = JSON.parse(data);

    return {
        hubs: parsed.hubs ?? [],
        villages: parsed.villages ?? [],
        branches: parsed.branches ?? [],
        logisticians: parsed.logisticians ?? [],
        villageCoordinateOverrides: parsed.villageCoordinateOverrides ?? {}
    };
}

export function clearData() {
    localStorage.removeItem(STORAGE_KEY);
}