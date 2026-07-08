import { useEffect, useRef, useMemo } from "react";
import { CircleMarker, Popup, useMap } from "react-leaflet";
import useAppStore from "../../../store/appStore";
import { resolveVillageCoord } from "../../../services/coordinatesService";
import { findVillageById, isSameVillageId } from "../../../utils/villageId";

const COLOR_CURRENT = "#4caf50";
const COLOR_OTHER_BRANCH = "#2e7d32";
const COLOR_INACTIVE = "#bdbdbd";
const COLOR_END = "#f44336";
const COLOR_FIXED = "#9c27b0";

function RouteStopMarker({ village, overrides, orderIndex, isEnd }) {
    const markerRef = useRef(null);
    const coords = resolveVillageCoord(village.kato, overrides);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [village.id]);

    if (!coords) return null;

    return (
        <CircleMarker
            ref={markerRef}
            center={[coords.lat, coords.lng]}
            radius={12}
            pathOptions={{
                fillColor: "#1976d2",
                color: "#ffffff",
                weight: 4,
                fillOpacity: 1
            }}
        >
            <Popup>
                <strong>{village.name}</strong>
                <br />
                <small style={{ color: "#1976d2", fontWeight: "bold" }}>
                    {isEnd ? `🏁 Точка Б · #${orderIndex}` : `Остановка #${orderIndex}`}
                </small>
            </Popup>
        </CircleMarker>
    );
}

function SelectedVillageMarker({ village, overrides }) {
    const map = useMap();
    const markerRef = useRef(null);
    const coords = resolveVillageCoord(village.kato, overrides);

    useEffect(() => {
        if (!coords) return;
        map.flyTo([coords.lat, coords.lng], 12, {
            animate: true,
            duration: 1.2
        });
    }, [village.kato, coords, map]);

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [village.kato]);

    if (!coords) return null;

    return (
        <CircleMarker
            ref={markerRef}
            center={[coords.lat, coords.lng]}
            radius={10}
            pathOptions={{
                fillColor: "#1976d2",
                color: "#ffffff",
                weight: 3,
                fillOpacity: 1
            }}
        >
            <Popup>
                <strong>{village.name}</strong>
                <br />
                {village.fullName}
                <br />
                <small>Хаб: {village.hubName}</small>
            </Popup>
        </CircleMarker>
    );
}

function VillageLayer() {
    const {
        villages,
        branches,
        selectedHub,
        selectedBranch,
        selectedVillage,
        selectedRouteStopId,
        mapAddVillageMode,
        coordinateEditMode,
        villageCoordinateOverrides,
        updateBranchVillages
    } = useAppStore();

    const hubKato = selectedHub?.kato ?? selectedBranch?.hubKato;
    const branchVillageIds = selectedBranch?.villageIds ?? [];
    const lastVillageId = branchVillageIds[branchVillageIds.length - 1];

    const hubVillages = hubKato
        ? villages.filter(village => village.hubKato === hubKato)
        : [];

    const villageBranchMap = useMemo(() => {
        const map = new Map();
        if (!hubKato) return map;

        (branches ?? [])
            .filter(b => b.hubKato === hubKato)
            .forEach(branch => {
                (branch.villageIds ?? []).forEach(id => {
                    if (!map.has(id)) map.set(id, []);
                    map.get(id).push(branch);
                });
            });
        return map;
    }, [branches, hubKato]);

    const handleAddToRoute = (village) => {
        if (!selectedBranch || branchVillageIds.includes(village.id)) return;
        updateBranchVillages(selectedBranch.id, [...branchVillageIds, village.id]);
    };

    return (
        <>
            {hubVillages.map(village => {
                if (selectedVillage?.kato === village.kato && !coordinateEditMode) return null;
                if (
                    isSameVillageId(selectedRouteStopId, village.id)
                    && selectedBranch
                    && !coordinateEditMode
                ) return null;

                const coords = resolveVillageCoord(village.kato, villageCoordinateOverrides);
                if (!coords) return null;

                const usedInBranches = villageBranchMap.get(village.id) ?? [];
                const isInCurrentBranch = branchVillageIds.includes(village.id);
                const isInOtherBranch = !isInCurrentBranch && usedInBranches.length > 0;
                const isUsedAnywhere = usedInBranches.length > 0;
                const isEnd = isInCurrentBranch && village.id === lastVillageId;
                const isOverridden = Boolean(villageCoordinateOverrides[village.kato]);
                const orderIndex = branchVillageIds.indexOf(village.id) + 1;
                const canAddFromMap = mapAddVillageMode
                    && selectedBranch
                    && !isInCurrentBranch
                    && !isInOtherBranch;

                let fillColor = COLOR_INACTIVE;
                let radius = 5;
                let weight = 1;
                let fillOpacity = 0.55;

                if (isInCurrentBranch) {
                    fillColor = isEnd ? COLOR_END : COLOR_CURRENT;
                    radius = isEnd ? 9 : 8;
                    weight = 3;
                    fillOpacity = 1;
                } else if (isInOtherBranch) {
                    fillColor = COLOR_OTHER_BRANCH;
                    radius = 7;
                    weight = 2;
                    fillOpacity = 0.95;
                } else if (canAddFromMap) {
                    radius = 7;
                    weight = 2;
                    fillOpacity = 0.75;
                }

                if (isOverridden && !isInCurrentBranch && !isInOtherBranch) {
                    fillColor = COLOR_FIXED;
                    weight = 2;
                }

                return (
                    <CircleMarker
                        key={village.kato}
                        center={[coords.lat, coords.lng]}
                        radius={radius}
                        pathOptions={{
                            fillColor,
                            color: "#ffffff",
                            weight,
                            fillOpacity
                        }}
                        eventHandlers={{
                            click: (e) => {
                                if (canAddFromMap) {
                                    e.originalEvent.stopPropagation();
                                    handleAddToRoute(village);
                                }
                            }
                        }}
                    >
                        <Popup>
                            <strong>{village.name}</strong>
                            <br />
                            {village.fullName}
                            {isOverridden && (
                                <>
                                    <br />
                                    <small style={{ color: COLOR_FIXED }}>✎ Координаты исправлены</small>
                                </>
                            )}
                            {isInCurrentBranch && (
                                <>
                                    <br />
                                    <small style={{
                                        color: isEnd ? COLOR_END : COLOR_CURRENT,
                                        fontWeight: "bold"
                                    }}>
                                        {isEnd
                                            ? `🏁 Точка Б · #${orderIndex}`
                                            : `✓ Эта ветка · #${orderIndex}`}
                                    </small>
                                </>
                            )}
                            {isInOtherBranch && (
                                <>
                                    <br />
                                    <small style={{ color: COLOR_OTHER_BRANCH, fontWeight: "bold" }}>
                                        ✓ Занято: {usedInBranches.map(b => b.name).join(", ")}
                                    </small>
                                </>
                            )}
                            {!isUsedAnywhere && hubKato && (
                                <>
                                    <br />
                                    <small style={{ color: "#888" }}>Свободно</small>
                                </>
                            )}
                            {canAddFromMap && (
                                <>
                                    <br />
                                    <button
                                        onClick={() => handleAddToRoute(village)}
                                        style={{
                                            marginTop: 6,
                                            padding: "4px 10px",
                                            border: "none",
                                            borderRadius: 4,
                                            background: COLOR_CURRENT,
                                            color: "white",
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                            fontSize: 12
                                        }}
                                    >
                                        + Добавить в маршрут
                                    </button>
                                </>
                            )}
                        </Popup>
                    </CircleMarker>
                );
            })}

            {selectedRouteStopId && selectedBranch && !coordinateEditMode && (() => {
                const stopVillage = findVillageById(villages, selectedRouteStopId);
                if (!stopVillage) return null;
                const orderIndex = branchVillageIds.findIndex(id =>
                    isSameVillageId(id, stopVillage.id)
                ) + 1;
                const isEnd = isSameVillageId(selectedRouteStopId, lastVillageId);
                return (
                    <RouteStopMarker
                        village={stopVillage}
                        overrides={villageCoordinateOverrides}
                        orderIndex={orderIndex}
                        isEnd={isEnd}
                    />
                );
            })()}

            {selectedVillage && !selectedBranch && !coordinateEditMode && (
                <SelectedVillageMarker
                    village={selectedVillage}
                    overrides={villageCoordinateOverrides}
                />
            )}
        </>
    );
}

export default VillageLayer;
