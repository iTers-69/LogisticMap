import defaultAppData from "../data/defaultAppData.json";
import { loadData as loadLocalData, saveData as saveLocalData } from "./storageService";
import { ensureBranchOrderPreserved, migrateAppData } from "./migrateAppData";
import { canEditData } from "./authService.js";
import {
    isCloudEnabled,
    isAppDataEmpty,
    fetchCloudData,
    saveCloudData
} from "./cloudService";

export async function resolveInitialData() {
    const defaultMigrated = migrateAppData(defaultAppData);
    const localRaw = loadLocalData();
    const localMigrated = localRaw ? migrateAppData(localRaw) : null;

    if (!isCloudEnabled()) {
        if (localMigrated && !isAppDataEmpty(localMigrated.data)) {
            return { source: "local", data: localMigrated.data, migrated: localMigrated.hubAssignmentsFixed > 0 };
        }
        return { source: "default", data: defaultMigrated.data, migrated: defaultMigrated.hubAssignmentsFixed > 0 };
    }

    try {
        const cloudData = await fetchCloudData();

        if (cloudData && !isAppDataEmpty(cloudData)) {
            const { updatedAt, ...raw } = cloudData;
            const migrated = migrateAppData(raw);

            if (migrated.hubAssignmentsFixed > 0) {
                await persistAppData(migrated.data);
            } else {
                saveLocalData(migrated.data);
            }

            return {
                source: "cloud",
                data: migrated.data,
                updatedAt,
                migrated: migrated.hubAssignmentsFixed > 0
            };
        }

        const seedMigrated = (localMigrated && !isAppDataEmpty(localMigrated.data))
            ? localMigrated
            : defaultMigrated;

        await saveCloudData(seedMigrated.data);
        saveLocalData(seedMigrated.data);

        return {
            source: localMigrated && !isAppDataEmpty(localMigrated.data) ? "local-seeded" : "default-seeded",
            data: seedMigrated.data,
            migrated: seedMigrated.hubAssignmentsFixed > 0
        };
    } catch (error) {
        console.error("Ошибка загрузки из облака:", error);

        if (localMigrated && !isAppDataEmpty(localMigrated.data)) {
            return {
                source: "local-fallback",
                data: localMigrated.data,
                error,
                migrated: localMigrated.hubAssignmentsFixed > 0
            };
        }

        return {
            source: "default-fallback",
            data: defaultMigrated.data,
            error,
            migrated: defaultMigrated.hubAssignmentsFixed > 0
        };
    }
}

export async function persistAppData(data, options = {}) {
    const { allowReadOnly = false } = options;
    const normalized = ensureBranchOrderPreserved(data);

    if (!allowReadOnly && !canEditData()) {
        return { ok: false, mode: "readonly", error: "Требуется вход" };
    }

    saveLocalData(normalized);

    if (!isCloudEnabled()) return { ok: true, mode: "local" };

    try {
        await saveCloudData(normalized);
        return { ok: true, mode: "cloud" };
    } catch (error) {
        console.error("Ошибка сохранения в облако:", error);
        return { ok: false, mode: "local-fallback", error };
    }
}
