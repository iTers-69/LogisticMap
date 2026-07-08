import { normalizeAppData } from "./cloudService.js";
import {
    applyHubAssignments,
    cleanupBranchesAfterHubChanges
} from "./hubAssignmentService.js";

function markManualBranches(branches) {
    return branches.map(branch => ({
        ...branch,
        manualRoute: (branch.villageIds ?? []).length > 0
            ? true
            : branch.manualRoute
    }));
}

export function migrateAppData(data) {
    const normalized = normalizeAppData(data);

    const { villages, fixedCount } = applyHubAssignments(
        normalized.villages,
        normalized.hubs
    );

    const branches = fixedCount > 0
        ? cleanupBranchesAfterHubChanges(normalized.branches, villages)
        : normalized.branches;

    return {
        data: {
            ...normalized,
            villages,
            branches: markManualBranches(branches)
        },
        hubAssignmentsFixed: fixedCount
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
