import { normalizeAppData, isAppDataEmpty } from "./cloudService";
import { ensureBranchOrderPreserved } from "./migrateAppData";

const BACKUP_VERSION = 1;

export function buildBackupPayload(state) {
    const data = ensureBranchOrderPreserved({
        hubs: state.hubs,
        villages: state.villages,
        branches: state.branches,
        logisticians: state.logisticians,
        villageCoordinateOverrides: state.villageCoordinateOverrides
    });

    return {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        app: "logisticMap",
        data
    };
}

export function downloadBackup(state) {
    const payload = buildBackupPayload(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");

    link.href = url;
    link.download = `logisticmap-backup-${date}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

export function parseBackupFile(text) {
    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error("Файл не является корректным JSON");
    }

    const rawData = parsed?.data ?? parsed;

    if (!rawData || typeof rawData !== "object") {
        throw new Error("В файле нет данных приложения");
    }

    const data = ensureBranchOrderPreserved(normalizeAppData(rawData));

    if (isAppDataEmpty(data)) {
        throw new Error("Файл пустой — нет хабов и сёл");
    }

    return {
        data,
        exportedAt: parsed.exportedAt ?? null,
        version: parsed.version ?? null
    };
}
