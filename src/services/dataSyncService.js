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

function migrationApplied(migrated) {
    return migrated.hubAssignmentsFixed > 0
        || migrated.logisticianAssignmentsFixed > 0
        || migrated.branchNamesRenamed > 0;
}

export async function resolveInitialData() {
    const defaultMigrated = migrateAppData(defaultAppData);
    const localRaw = loadLocalData();
    const localMigrated = localRaw ? migrateAppData(localRaw) : null;

    if (!isCloudEnabled()) {
        if (localMigrated && !isAppDataEmpty(localMigrated.data)) {
            return { source: "local", data: localMigrated.data, migrated: migrationApplied(localMigrated) };
        }
        return { source: "default", data: defaultMigrated.data, migrated: migrationApplied(defaultMigrated) };
    }

    try {
        const cloudData = await fetchCloudData();

        if (cloudData && !isAppDataEmpty(cloudData)) {
            const { updatedAt, ...raw } = cloudData;
            const migrated = migrateAppData(raw);

            if (migrationApplied(migrated)) {
                await persistAppData(migrated.data);
            } else {
                saveLocalData(migrated.data);
            }

            return {
                source: "cloud",
                data: migrated.data,
                updatedAt,
                migrated: migrationApplied(migrated)
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
            migrated: migrationApplied(seedMigrated)
        };
    } catch (error) {
        console.error("Ошибка загрузки из облака:", error);

        if (localMigrated && !isAppDataEmpty(localMigrated.data)) {
            return {
                source: "local-fallback",
                data: localMigrated.data,
                error,
                migrated: migrationApplied(localMigrated)
            };
        }

        return {
            source: "default-fallback",
            data: defaultMigrated.data,
            error,
            migrated: migrationApplied(defaultMigrated)
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
