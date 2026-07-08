import { applyLogisticianAssignments } from "../services/logisticianAssignmentService.js";

/**
 * Назначает логистов веткам по хабу (см. logisticianAssignmentService).
 * Сохраняет существующий список логистов, добавляет недостающих (в т.ч. Лауру).
 */
export default function buildLogisticians(branches, existingLogisticians = []) {
    const { branches: assigned, logisticians } = applyLogisticianAssignments(
        branches,
        existingLogisticians
    );

    const byId = new Map(assigned.map(b => [b.id, b]));
    branches.forEach(branch => {
        const updated = byId.get(branch.id);
        if (updated) {
            branch.logisticianId = updated.logisticianId;
        }
    });

    return logisticians;
}
