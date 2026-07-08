/** Хаб (KATO) → ответственный логист */
export const HUB_LOGISTICIAN_BY_KATO = {
    "710000000": "Татьяна",      // Астана
    "591010000": "Татьяна",      // Петропавловск
    "111010000": "Татьяна",      // Кокшетау
    "551010000": "Татьяна",      // Павлодар
    "391010000": "Татьяна",      // Костанай
    "151010000": "Акмарал",      // Актобе
    "231010000": "Акмарал",      // Атырау
    "271010000": "Акмарал",      // Уральск
    "351010000": "Акмарал",      // Караганда
    "471010000": "Акмарал",      // Актау
    "631010000": "Канат",        // Усть-Каменогорск
    "101010000": "Канат",        // Семей
    "790000000": "Канат",        // Шымкент
    "750000000": "Лаура",        // Алматы
    "331010000": "Лаура",        // Талдыкорган
    "311010000": "Эльмира",      // Тараз
    "431010000": "Эльмира",      // Кызылорда
    "621010000": "Эльмира"       // Жезказган
};

const REQUIRED_LOGISTICIAN_NAMES = [
    "Татьяна",
    "Акмарал",
    "Канат",
    "Эльмира",
    "Лаура"
];

function ensureLogisticians(logisticians) {
    const list = (logisticians ?? []).map(l => ({
        ...l,
        branchIds: [...(l.branchIds ?? [])],
        totalVillages: l.totalVillages ?? 0
    }));

    let nextId = list.reduce((max, l) => Math.max(max, Number(l.id) || 0), 0) + 1;

    for (const name of REQUIRED_LOGISTICIAN_NAMES) {
        if (!list.some(l => l.name === name)) {
            list.push({
                id: nextId++,
                name,
                branchIds: [],
                totalVillages: 0
            });
        }
    }

    return list;
}

function rebuildLogisticianStats(logisticians, branches) {
    const stats = logisticians.map(l => ({
        ...l,
        branchIds: [],
        totalVillages: 0
    }));

    const byId = new Map(stats.map(l => [l.id, l]));

    for (const branch of branches) {
        const log = byId.get(branch.logisticianId);
        if (!log) continue;
        log.branchIds.push(branch.id);
        log.totalVillages += branch.totalStops ?? 0;
    }

    return stats;
}

export function applyLogisticianAssignments(branches, logisticians) {
    const ensured = ensureLogisticians(logisticians);
    const nameToId = new Map(ensured.map(l => [l.name, l.id]));
    let fixedCount = 0;

    if (ensured.length !== (logisticians?.length ?? 0)) {
        fixedCount += 1;
    }

    const updatedBranches = (branches ?? []).map(branch => {
        const expectedName = HUB_LOGISTICIAN_BY_KATO[branch.hubKato];
        if (!expectedName) return branch;

        const expectedId = nameToId.get(expectedName);
        if (!expectedId || branch.logisticianId === expectedId) {
            return branch;
        }

        fixedCount += 1;
        return { ...branch, logisticianId: expectedId };
    });

    const updatedLogisticians = rebuildLogisticianStats(ensured, updatedBranches);

    const statsChanged = (logisticians ?? []).some(old => {
        const next = updatedLogisticians.find(l => l.id === old.id);
        if (!next) return true;
        return next.totalVillages !== (old.totalVillages ?? 0)
            || (next.branchIds?.length ?? 0) !== (old.branchIds?.length ?? 0);
    });

    if (statsChanged && fixedCount === 0) {
        fixedCount += 1;
    }

    return {
        branches: updatedBranches,
        logisticians: updatedLogisticians,
        fixedCount
    };
}
