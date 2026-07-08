export function villageIdKey(id) {
    if (id == null || id === "") return "";
    return String(id);
}

export function isSameVillageId(a, b) {
    return villageIdKey(a) === villageIdKey(b);
}

export function findVillageById(villages, id) {
    if (!id || !villages?.length) return null;
    const key = villageIdKey(id);
    return villages.find(v =>
        villageIdKey(v.id) === key || villageIdKey(v.kato) === key
    ) ?? null;
}
