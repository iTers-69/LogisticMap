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

export function normalizeHubKato(hubKato) {
    if (hubKato == null || hubKato === "") return "";
    return String(hubKato);
}

export function normalizeLogisticianId(id) {
    if (id == null || id === "") return null;
    const num = Number(id);
    return Number.isFinite(num) ? num : null;
}

export function getExpectedLogisticianName(hubKato) {
    return HUB_LOGISTICIAN_BY_KATO[normalizeHubKato(hubKato)] ?? null;
}

function ensureLogisticians(logisticians) {
    const list = (logisticians ?? []).map(l => ({
        ...l,
        id: normalizeLogisticianId(l.id) ?? l.id,
        branchIds: [...(l.branchIds ?? [])],
        totalVillages: l.totalVillages ?? 0
    }));

    let nextId = list.reduce((max, l) => Math.max(max, normalizeLogisticianId(l.id) ?? 0), 0) + 1;

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
        const logId = normalizeLogisticianId(branch.logisticianId);
        if (!logId) continue;
        const log = byId.get(logId);
        if (!log) continue;
        log.branchIds.push(branch.id);
        log.totalVillages += branch.totalStops ?? 0;
    }

    return stats;
}

function buildNameToIdMap(logisticians) {
    const map = new Map();
    for (const log of logisticians) {
        if (!map.has(log.name)) {
            map.set(log.name, log.id);
        }
    }
    return map;
}

/**
 * Назначает логиста ветке по хабу (если хаб в списке).
 */
export function assignBranchHubLogistician(branch, nameToId) {
    const expectedName = getExpectedLogisticianName(branch.hubKato);
    if (!expectedName) return branch;

    const expectedId = nameToId.get(expectedName);
    if (!expectedId) return branch;

    const currentId = normalizeLogisticianId(branch.logisticianId);
    if (currentId === expectedId) {
        return currentId === branch.logisticianId
            ? branch
            : { ...branch, logisticianId: expectedId };
    }

    return { ...branch, logisticianId: expectedId };
}

/**
 * Все ветки хабов из списка получают закреплённого логиста.
 * @param {object} [options]
 * @param {string} [options.onlyHubKato] — только ветки этого хаба (остальные не трогаем)
 */
export function applyLogisticianAssignments(branches, logisticians, options = {}) {
    const { onlyHubKato = null } = options;
    const scopeKey = onlyHubKato ? normalizeHubKato(onlyHubKato) : null;

    const ensured = ensureLogisticians(logisticians);
    const nameToId = buildNameToIdMap(ensured);
    let fixedCount = 0;

    if (ensured.length !== (logisticians?.length ?? 0)) {
        fixedCount += 1;
    }

    const updatedBranches = (branches ?? []).map(branch => {
        if (scopeKey && normalizeHubKato(branch.hubKato) !== scopeKey) {
            const normalizedId = normalizeLogisticianId(branch.logisticianId);
            if (normalizedId === branch.logisticianId) return branch;
            fixedCount += 1;
            return { ...branch, logisticianId: normalizedId };
        }

        const assigned = assignBranchHubLogistician(branch, nameToId);
        if (assigned !== branch) {
            fixedCount += 1;
        }
        return assigned;
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
