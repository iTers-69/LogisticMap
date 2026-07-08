/**
 * Привязка области (из fullName) к логистическому хабу.
 * Акмолинская область → Астана (по бизнес-логике проекта).
 */
export const REGION_TO_HUB_KATO = {
    "Акмолинская область": "710000000",
    "Павлодарская область": "551010000",
    "Карагандинская область": "351010000",
    "Кызылординская область": "431010000",
    "Туркестанская область": "790000000",
    "Жамбылская область": "311010000",
    "Алматинская область": "750000000",
    "Восточно-Казахстанская область": "631010000",
    "Актюбинская область": "151010000",
    "Западно-Казахстанская область": "271010000",
    "Северо-Казахстанская область": "591010000",
    "Костанайская область": "391010000",
    "Мангистауская область": "471010000",
    "Атырауская область": "231010000",
    "Область Абай": "101010000",
    "Область Жетісу": "331010000",
    "Область Ұлытау": "621010000"
};

export function getRegionFromFullName(fullName) {
    return fullName?.split(",")?.[0]?.trim() ?? "";
}

export function getHubKatoForRegion(fullName) {
    const region = getRegionFromFullName(fullName);
    return REGION_TO_HUB_KATO[region] ?? null;
}

export function getHubAssignmentIssues(villages, hubs) {
    const hubByKato = new Map(hubs.map(h => [h.kato, h]));

    return villages
        .map(village => {
            const expectedKato = getHubKatoForRegion(village.fullName);
            if (!expectedKato || village.hubKato === expectedKato) return null;

            const expectedHub = hubByKato.get(expectedKato);
            if (!expectedHub) return null;

            return {
                kato: village.kato,
                name: village.name,
                region: getRegionFromFullName(village.fullName),
                fromHub: village.hubName,
                toHub: expectedHub.name,
                toHubKato: expectedHub.kato
            };
        })
        .filter(Boolean);
}

export function applyHubAssignments(villages, hubs) {
    const hubByKato = new Map(hubs.map(h => [h.kato, h]));
    let fixedCount = 0;

    const updatedVillages = villages.map(village => {
        const expectedKato = getHubKatoForRegion(village.fullName);
        if (!expectedKato || village.hubKato === expectedKato) return village;

        const hub = hubByKato.get(expectedKato);
        if (!hub) return village;

        fixedCount++;
        return {
            ...village,
            hubKato: hub.kato,
            hubName: hub.name,
            isEdited: true
        };
    });

    return { villages: updatedVillages, fixedCount };
}

export function cleanupBranchesAfterHubChanges(branches, villages) {
    const villageHubMap = new Map(
        villages.map(v => [String(v.id ?? v.kato), v.hubKato])
    );

    return branches.map(branch => {
        const newIds = (branch.villageIds ?? []).filter(id => {
            const villageHub = villageHubMap.get(String(id));
            return villageHub === branch.hubKato;
        });

        if (newIds.length === (branch.villageIds ?? []).length) return branch;

        return {
            ...branch,
            villageIds: newIds,
            totalStops: newIds.length,
            endPointKato: newIds.length ? newIds[newIds.length - 1] : null,
            manualRoute: true
        };
    });
}
