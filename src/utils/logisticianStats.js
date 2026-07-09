export function getLogisticianStats(logistician, branches) {
    const logBranches = (branches ?? []).filter(b => b.logisticianId === logistician.id);
    const hubKatos = new Set(logBranches.map(b => b.hubKato));
    const totalVillages = logBranches.reduce((sum, b) => sum + (b.totalStops || 0), 0);

    return {
        hubsCount: hubKatos.size,
        branchesCount: logBranches.length,
        villagesCount: totalVillages
    };
}
