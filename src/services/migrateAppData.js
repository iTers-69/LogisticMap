import { normalizeAppData } from "./cloudService.js";
import {
    applyHubAssignments,
    cleanupBranchesAfterHubChanges
} from "./hubAssignmentService.js";
import { applyLogisticianAssignments } from "./logisticianAssignmentService.js";

function markManualBranches(branches) {
    return branches.map(branch => ({
        ...branch,
        manualRoute: (branch.villageIds ?? []).length > 0
            ? true
            : branch.manualRoute
    }));
}

function renameExitBranchesToVetka(branches) {
    let fixedCount = 0;
    const updated = (branches ?? []).map(branch => {
        const match = /^Выезд\s+(\d+)$/i.exec(branch.name ?? "");
        if (!match) return branch;
        fixedCount += 1;
        return { ...branch, name: `Ветка ${match[1]}` };
    });
    return { branches: updated, fixedCount };
}

export function migrateAppData(data) {
    const normalized = normalizeAppData(data);

    const { villages, fixedCount } = applyHubAssignments(
        normalized.villages,
        normalized.hubs
    );

    const branchesAfterHub = fixedCount > 0
        ? cleanupBranchesAfterHubChanges(normalized.branches, villages)
        : normalized.branches;

    const {
        branches,
        logisticians,
        fixedCount: logisticianFixedCount
    } = applyLogisticianAssignments(
        branchesAfterHub,
        normalized.logisticians
    );

    const { branches: renamedBranches, fixedCount: branchNamesRenamed } = renameExitBranchesToVetka(branches);

    return {
        data: {
            ...normalized,
            villages,
            branches: markManualBranches(renamedBranches),
            logisticians
        },
        hubAssignmentsFixed: fixedCount,
        logisticianAssignmentsFixed: logisticianFixedCount,
        branchNamesRenamed
    };
}

/**
 * Помечает все ветки с сёлами как manualRoute,
 * чтобы порядок остановок не пересчитывался при отображении.
 * Также исправляет привязку сёл к хабам по области.
 */
export function ensureBranchOrderPreserved(data) {
    return migrateAppData(data).data;
}
