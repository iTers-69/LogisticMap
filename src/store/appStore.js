import { create } from "zustand";
import { createBranch } from "../models/branchModel";
import hubCoordinates from "../data/hubCoordinates";
import { movePoint } from "../../tools/geoUtils.js";
import buildLogisticians from "../algorithms/buildLogisticians.js";
import { buildHubBranches } from "../services/branchBuilderService.js";
import { resolveVillageCoord } from "../services/coordinatesService.js";
import {
    applyHubAssignments,
    cleanupBranchesAfterHubChanges
} from "../services/hubAssignmentService.js";
import {
    canEditData,
    isAuthRequired,
    getAuthUser,
    login as authLogin,
    logout as authLogout
} from "../services/authService.js";

const BRANCH_COLORS = [
    "#e53935", "#1e88e5", "#43a047", "#fb8c00",
    "#8e24aa", "#00acc1", "#6d4c41", "#546e7a"
];

function nextBranchNumber(branches, hubKato) {
    let maxNum = 0;
    branches
        .filter(b => b.hubKato === hubKato)
        .forEach(b => {
            const num = Number(b.id.split("-").pop());
            if (!isNaN(num)) maxNum = Math.max(maxNum, num);
        });
    return maxNum + 1;
}

function buildCoordinatesMap(villages, overrides) {
    const map = {};
    villages.forEach(village => {
        const coords = resolveVillageCoord(village.kato, overrides);
        if (coords) map[village.kato] = coords;
    });
    return map;
}

function rebuildBranchesForHub(hub, villages, overrides, existingBranches) {
    const hubCoords = hubCoordinates[hub.kato];
    if (!hubCoords) return existingBranches;

    const hubVillages = villages.filter(v => v.hubKato === hub.kato);
    const coordinates = buildCoordinatesMap(hubVillages, overrides);
    const newHubBranches = buildHubBranches(hub, hubVillages, hubCoords, coordinates);
    const otherBranches = existingBranches.filter(b => b.hubKato !== hub.kato);

    return [...otherBranches, ...newHubBranches];
}

const useAppStore = create((set) => ({

    hubs: [],

    branches: [],

    villages: [],

    logisticians: [],

    selectedLogistician: null,

    selectedHub: null,

    selectedBranch: null,

    selectedVillage: null,

    /** id села, выбранного в списке остановок маршрута */
    selectedRouteStopId: null,

    activeTab: "hubs",

    customRouteStart: null,

    customRouteEnd: null,

    customRouteData: null,

    branchRouteData: null,

    routeLoading: false,

    routeAnimation: {
        playing: false,
        progress: 0,
        speed: 1
    },

    mapAddVillageMode: false,

    villageCoordinateOverrides: {},

    coordinateEditMode: false,

    dataLoading: true,

    syncStatus: "idle",

    lastSavedAt: null,

    authRequired: false,
    canEdit: true,
    authUser: null,

    initAuth: () =>
        set({
            authRequired: isAuthRequired(),
            canEdit: canEditData(),
            authUser: getAuthUser()
        }),

    login: (username, password, remember = false) => {
        const result = authLogin(username, password, remember);
        if (result.ok) {
            set({ canEdit: true, authUser: result.user ?? username });
        }
        return result;
    },

    logout: () => {
        authLogout();
        set({
            canEdit: false,
            authUser: null,
            coordinateEditMode: false,
            mapAddVillageMode: false
        });
    },

    setMapAddVillageMode: (enabled) =>
        set({ mapAddVillageMode: enabled }),

    setCoordinateEditMode: (enabled) =>
        set({ coordinateEditMode: enabled }),

    setDataLoading: (loading) =>
        set({ dataLoading: loading }),

    setSyncStatus: (syncStatus, lastSavedAt = null) =>
        set({
            syncStatus,
            lastSavedAt: lastSavedAt ?? new Date().toISOString()
        }),

    setVillageCoordinate: (kato, lat, lng) =>
        set((state) => ({
            villageCoordinateOverrides: {
                ...state.villageCoordinateOverrides,
                [String(kato)]: { lat: Number(lat), lng: Number(lng) }
            },
            branchRouteData: null,
            routeAnimation: { playing: false, progress: 0, speed: 1 }
        })),

    resetVillageCoordinate: (kato) =>
        set((state) => {
            const next = { ...state.villageCoordinateOverrides };
            delete next[String(kato)];
            return {
                villageCoordinateOverrides: next,
                branchRouteData: null,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    setCustomRouteData: (data) =>
        set({
            customRouteData: data
        }),

    setBranchRouteData: (data) =>
        set({
            branchRouteData: data
        }),

    setRouteLoading: (loading) =>
        set({
            routeLoading: loading
        }),

    setRouteAnimation: (patch) =>
        set((state) => ({
            routeAnimation: { ...state.routeAnimation, ...patch }
        })),

    resetRouteAnimation: () =>
        set({
            routeAnimation: { playing: false, progress: 0, speed: 1 }
        }),

    playRouteAnimation: () =>
        set((state) => ({
            routeAnimation: {
                ...state.routeAnimation,
                playing: true,
                progress: state.routeAnimation.progress >= 1 ? 0 : state.routeAnimation.progress
            }
        })),

    selectHub: (hub) =>
        set({
            selectedHub: hub,
            selectedBranch: null,
            selectedVillage: null,
            selectedRouteStopId: null,
            customRouteStart: null,
            customRouteEnd: null,
            customRouteData: null,
            mapAddVillageMode: false,
            coordinateEditMode: false
        }),

    selectBranch: (branch) =>
        set((state) => ({
            selectedBranch: branch,
            selectedHub: state.hubs.find(h => h.kato === branch.hubKato) ?? state.selectedHub,
            selectedRouteStopId: null,
            customRouteStart: null,
            customRouteEnd: null,
            customRouteData: null,
            branchRouteData: null,
            routeLoading: false,
            routeAnimation: { playing: false, progress: 0, speed: 1 },
            coordinateEditMode: false
        })),

    selectVillage: (village) =>
        set((state) => ({
            selectedVillage: village,
            selectedRouteStopId: null,
            selectedHub: state.selectedHub?.kato === village.hubKato
                ? state.selectedHub
                : null,
            selectedBranch: null,
            customRouteStart: null,
            customRouteEnd: null,
            customRouteData: null,
            mapAddVillageMode: false,
            coordinateEditMode: false
        })),

    selectRouteStop: (villageId) =>
        set({ selectedRouteStopId: villageId }),

    selectLogistician: (logistician) =>
        set({

            selectedLogistician: logistician,

            selectedBranch: null,

            selectedVillage: null,

            customRouteStart: null,

            customRouteEnd: null,

            customRouteData: null

        }),

    setCustomRouteStart: (point) =>
        set({
            customRouteStart: point,
            selectedHub: null,
            selectedBranch: null,
            selectedVillage: null,
            selectedLogistician: null,
            customRouteData: null
        }),

    setCustomRouteEnd: (point) =>
        set({
            customRouteEnd: point,
            selectedHub: null,
            selectedBranch: null,
            selectedVillage: null,
            selectedLogistician: null,
            customRouteData: null
        }),

    clearCustomRoute: () =>
        set({
            customRouteStart: null,
            customRouteEnd: null,
            customRouteData: null
        }),

    setActiveTab: (tab) =>
        set({
            activeTab: tab
        }),

    setHubs: (hubs) =>
        set({
            hubs
        }),

    setBranches: (branches) =>
        set({
            branches
        }),

    setLogisticians: (logisticians) =>
        set({
            logisticians
        }),

    setVillages: (villages) =>
        set({
            villages
        }),

    updateLogisticianName: (logisticianId, newName) =>
        set((state) => ({
            logisticians: state.logisticians.map(l =>
                l.id === logisticianId ? { ...l, name: newName } : l
            )
        })),

    updateBranchVillages: (branchId, villageIds) =>
        set((state) => {
            const branches = state.branches.map(b => {
                if (b.id !== branchId) return b;
                return {
                    ...b,
                    villageIds,
                    totalStops: villageIds.length,
                    endPointKato: villageIds.length ? villageIds[villageIds.length - 1] : null,
                    manualRoute: true
                };
            });

            const updatedBranch = branches.find(b => b.id === branchId);

            return {
                branches,
                selectedBranch: state.selectedBranch?.id === branchId
                    ? updatedBranch
                    : state.selectedBranch,
                branchRouteData: null,
                routeLoading: false,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    updateVillageHub: (villageKato, newHubKato) =>
        set((state) => {
            const hub = state.hubs.find(h => h.kato === newHubKato);
            if (!hub) return state;

            const villageId = String(villageKato);

            const villages = state.villages.map(v =>
                String(v.kato) === villageId || String(v.id) === villageId
                    ? { ...v, hubKato: hub.kato, hubName: hub.name, isEdited: true }
                    : v
            );

            const branches = state.branches.map(b => {
                if (!(b.villageIds ?? []).includes(villageId)) return b;
                const newIds = b.villageIds.filter(id => id !== villageId);
                return {
                    ...b,
                    villageIds: newIds,
                    totalStops: newIds.length,
                    endPointKato: newIds.length ? newIds[newIds.length - 1] : null,
                    manualRoute: true
                };
            });

            const updatedVillage = villages.find(
                v => String(v.kato) === villageId || String(v.id) === villageId
            );

            const selectedBranchUpdated = state.selectedBranch
                ? branches.find(b => b.id === state.selectedBranch.id) ?? state.selectedBranch
                : null;

            return {
                villages,
                branches,
                selectedVillage: state.selectedVillage &&
                    (String(state.selectedVillage.kato) === villageId)
                    ? updatedVillage
                    : state.selectedVillage,
                selectedBranch: selectedBranchUpdated,
                branchRouteData: null,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    fixVillageHubsByRegion: () =>
        set((state) => {
            const { villages, fixedCount } = applyHubAssignments(
                state.villages,
                state.hubs
            );

            if (fixedCount === 0) return state;

            const branches = cleanupBranchesAfterHubChanges(
                state.branches,
                villages
            );

            const selectedBranch = state.selectedBranch
                ? branches.find(b => b.id === state.selectedBranch.id) ?? null
                : null;

            return {
                villages,
                branches,
                selectedBranch,
                branchRouteData: selectedBranch ? state.branchRouteData : null,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    updateBranchName: (branchId, name) =>
        set((state) => {
            const trimmed = name.trim();
            if (!trimmed) return state;

            const branches = state.branches.map(b =>
                b.id === branchId ? { ...b, name: trimmed } : b
            );
            const updated = branches.find(b => b.id === branchId);

            return {
                branches,
                selectedBranch: state.selectedBranch?.id === branchId
                    ? updated
                    : state.selectedBranch
            };
        }),

    addBranch: (hubKato) =>
        set((state) => {
            const num = nextBranchNumber(state.branches, hubKato);
            const id = `${hubKato}-${num}`;
            const hubCoords = hubCoordinates[hubKato];

            const branch = createBranch({
                id,
                hubKato,
                name: `Ветка ${num}`
            });

            branch.exitIndex = num;
            branch.color = BRANCH_COLORS[(num - 1) % BRANCH_COLORS.length];
            branch.manualRoute = true;

            if (hubCoords) {
                branch.exitPoint = movePoint(hubCoords, 0, 0.4);
            }

            return {
                branches: [...state.branches, branch],
                selectedBranch: branch,
                selectedHub: state.hubs.find(h => h.kato === hubKato) ?? state.selectedHub,
                branchRouteData: null,
                routeLoading: false,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    removeBranch: (branchId) =>
        set((state) => {
            const branch = state.branches.find(b => b.id === branchId);
            if (!branch) return state;

            let logisticians = state.logisticians;
            if (branch.logisticianId) {
                logisticians = logisticians.map(l => {
                    if (l.id !== branch.logisticianId) return l;
                    return {
                        ...l,
                        branchIds: (l.branchIds ?? []).filter(id => id !== branchId),
                        totalVillages: Math.max(0, (l.totalVillages ?? 0) - (branch.totalStops || 0))
                    };
                });
            }

            const isSelected = state.selectedBranch?.id === branchId;

            return {
                branches: state.branches.filter(b => b.id !== branchId),
                logisticians,
                selectedBranch: isSelected ? null : state.selectedBranch,
                branchRouteData: isSelected ? null : state.branchRouteData,
                routeLoading: isSelected ? false : state.routeLoading,
                routeAnimation: isSelected
                    ? { playing: false, progress: 0, speed: 1 }
                    : state.routeAnimation
            };
        }),

    rebuildHubBranches: (hubKato) =>
        set((state) => {
            const hub = state.hubs.find(h => h.kato === hubKato);
            if (!hub) return state;

            const branches = rebuildBranchesForHub(
                hub,
                state.villages,
                state.villageCoordinateOverrides,
                state.branches
            );
            const logisticians = buildLogisticians(branches);
            const hubBranchIds = new Set(
                branches.filter(b => b.hubKato === hubKato).map(b => b.id)
            );
            const selectedBranch = state.selectedBranch
                && hubBranchIds.has(state.selectedBranch.id)
                ? branches.find(b => b.id === state.selectedBranch.id) ?? null
                : state.selectedBranch?.hubKato === hubKato
                    ? null
                    : state.selectedBranch;

            return {
                branches,
                logisticians,
                selectedBranch,
                branchRouteData: selectedBranch ? state.branchRouteData : null,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    rebuildAllHubBranches: () =>
        set((state) => {
            let branches = state.branches;

            state.hubs.forEach(hub => {
                branches = rebuildBranchesForHub(
                    hub,
                    state.villages,
                    state.villageCoordinateOverrides,
                    branches
                );
            });

            return {
                branches,
                logisticians: buildLogisticians(branches),
                selectedBranch: null,
                branchRouteData: null,
                routeAnimation: { playing: false, progress: 0, speed: 1 }
            };
        }),

    assignBranchToLogistician: (branchId, newLogisticianId) =>
        set((state) => {
            const branch = state.branches.find(b => b.id === branchId);
            if (!branch) return state;

            const oldLogisticianId = branch.logisticianId;

            let logisticians = state.logisticians.map(l => {
                if (l.id === oldLogisticianId) {
                    return {
                        ...l,
                        branchIds: (l.branchIds ?? []).filter(id => id !== branchId),
                        totalVillages: (l.totalVillages ?? 0) - (branch.totalStops || 0)
                    };
                }
                return l;
            });

            logisticians = logisticians.map(l => {
                if (l.id === newLogisticianId) {
                    return {
                        ...l,
                        branchIds: [...(l.branchIds ?? []), branchId],
                        totalVillages: (l.totalVillages ?? 0) + (branch.totalStops || 0)
                    };
                }
                return l;
            });

            const branches = state.branches.map(b =>
                b.id === branchId ? { ...b, logisticianId: newLogisticianId } : b
            );

            return { logisticians, branches };
        }),

    addLogistician: (name) =>
        set((state) => {
            const maxId = state.logisticians.reduce((max, l) => Math.max(max, l.id), 0);
            return {
                logisticians: [...state.logisticians, {
                    id: maxId + 1,
                    name,
                    branchIds: [],
                    totalVillages: 0
                }]
            };
        }),

    removeLogistician: (logisticianId) =>
        set((state) => {
            const branches = state.branches.map(b =>
                b.logisticianId === logisticianId ? { ...b, logisticianId: null } : b
            );
            return {
                logisticians: state.logisticians.filter(l => l.id !== logisticianId),
                branches,
                selectedLogistician: state.selectedLogistician?.id === logisticianId
                    ? null : state.selectedLogistician
            };
        }),

    loadData: (data) =>
        set({

            hubs: data.hubs ?? [],

            villages: data.villages ?? [],

            branches: data.branches ?? [],

            logisticians: data.logisticians ?? [],

            villageCoordinateOverrides: data.villageCoordinateOverrides ?? {},

            selectedHub: null,

            selectedBranch: null,

            selectedVillage: null,

            selectedLogistician: null,

            customRouteStart: null,

            customRouteEnd: null,

            customRouteData: null,

            branchRouteData: null,

            routeLoading: false,

            routeAnimation: { playing: false, progress: 0, speed: 1 },

            mapAddVillageMode: false,

            coordinateEditMode: false,

            activeTab: "hubs"

        }),

    syncDataFromCloud: (data) =>
        set((state) => {
            const hubs = data.hubs ?? state.hubs;
            const villages = data.villages ?? state.villages;
            const branches = data.branches ?? state.branches;
            const logisticians = data.logisticians ?? state.logisticians;
            const villageCoordinateOverrides = data.villageCoordinateOverrides ?? state.villageCoordinateOverrides;

            const selectedBranch = state.selectedBranch
                ? branches.find(b => b.id === state.selectedBranch.id) ?? null
                : null;

            const selectedHub = state.selectedHub
                ? hubs.find(h => h.kato === state.selectedHub.kato) ?? null
                : null;

            const selectedVillage = state.selectedVillage
                ? villages.find(v => v.kato === state.selectedVillage.kato) ?? null
                : null;

            const selectedLogistician = state.selectedLogistician
                ? logisticians.find(l => l.id === state.selectedLogistician.id) ?? null
                : null;

            return {
                hubs,
                villages,
                branches,
                logisticians,
                villageCoordinateOverrides,
                selectedHub,
                selectedBranch,
                selectedVillage,
                selectedLogistician,
                branchRouteData: selectedBranch ? state.branchRouteData : null
            };
        }),

}));

export default useAppStore;