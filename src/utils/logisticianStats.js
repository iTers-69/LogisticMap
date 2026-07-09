export function getLogisticianStats(logistician, branches) {
    const logBranches = (branches ?? []).filter(b => b.logisticianId === logistician.id);
    const hubKatos = new Set(logBranches.map(b => b.hubKato));
    const totalVillages = logBranches.reduce((sum, b) => sum + (b.totalStops || 0), 0);

    return {
        hubsCount: hubKatos.size,
        branchesCount: logBranches.length,
        villagesCount: totalVillages,
        hubKatos: [...hubKatos]
    };
}

export function getLogisticianHubNames(logistician, branches, hubs) {
    const { hubKatos } = getLogisticianStats(logistician, branches);

    return hubKatos
        .map(kato => (hubs ?? []).find(h => h.kato === kato)?.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ru"));
}
