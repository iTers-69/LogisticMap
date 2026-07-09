import { useState, useEffect, useMemo, useRef } from "react";
import useAppStore from "../../store/appStore";
import hubCoordinates from "../../data/hubCoordinates";
import { resolveVillageCoord, isCoordOverridden, hasBaseVillageCoord } from "../../services/coordinatesService";
import { enrichBranch } from "../../utils/branchUtils";
import { findVillageById } from "../../utils/villageId";
import EditableRouteList from "./EditableRouteList";
import BranchNameEditor from "../Sidebar/BranchNameEditor";
import { getLogisticianStats } from "../../utils/logisticianStats";

function EmptyInspector() {
    return <aside className="inspector inspector--empty" />;
}

function Inspector() {
    const {
        selectedBranch,
        selectedVillage,
        selectedHub,
        selectedLogistician,
        activeTab,
        villages,
        branches,
        hubs,
        logisticians,
        branchRouteData,
        routeLoading,
        routeAnimation,
        assignBranchToLogistician,
        playRouteAnimation,
        setRouteAnimation,
        resetRouteAnimation,
        updateBranchName,
        villageCoordinateOverrides,
        coordinateEditMode,
        setCoordinateEditMode,
        setVillageCoordinate,
        resetVillageCoordinate,
        updateVillageHub,
        selectVillage,
        canEdit
    } = useAppStore();

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        let res = "";
        if (hrs > 0) res += `${hrs} ч `;
        if (hrs === 0 || mins > 0) res += `${mins} мин`;
        return res;
    };

    if (selectedBranch) {
        const hub = hubs.find(h => h.kato === selectedBranch.hubKato);
        const hubCoords = hubCoordinates[selectedBranch.hubKato];
        const branchInfo = hubCoords
            ? enrichBranch(selectedBranch, hubCoords, villages, new Proxy({}, {
                get(_t, prop) { return resolveVillageCoord(prop, villageCoordinateOverrides); }
            }))
            : selectedBranch;

        const lastRouteVillageId = selectedBranch.villageIds?.[selectedBranch.villageIds.length - 1];
        const endVillage = findVillageById(villages, branchInfo.endPointKato)
            ?? findVillageById(villages, lastRouteVillageId);

        return (
            <aside className="inspector">
                <h2 className="inspector__title">Маршрут</h2>
                <div className="route-branch-name">
                    <BranchNameEditor
                        branchId={selectedBranch.id}
                        name={branchInfo.name}
                        onSave={updateBranchName}
                    />
                </div>

                <div className="route-endpoints">
                    <div className="route-endpoints__row">
                        <span className="route-endpoints__label">Точка А</span>
                        <span className="route-endpoints__value">{hub?.name ?? "—"}</span>
                    </div>
                    {endVillage && (
                        <div className="route-endpoints__row route-endpoints__row--b">
                            <span className="route-endpoints__label">Точка Б</span>
                            <span className="route-endpoints__value">{endVillage.name}</span>
                        </div>
                    )}
                </div>

                {routeLoading && (
                    <p style={{ color: "#1976d2", fontWeight: "bold", fontSize: 13 }}>
                        🛣️ Перестраиваем маршрут...
                    </p>
                )}

                {branchRouteData && (
                    <div className="route-stats">
                        <div className="route-stats__row">
                            <span>Расстояние</span>
                            <strong>{(branchRouteData.distance / 1000).toFixed(1)} км</strong>
                        </div>
                        <div className="route-stats__row">
                            <span>Время</span>
                            <strong>{formatDuration(branchRouteData.duration)}</strong>
                        </div>

                        <div className="route-stats__actions">
                            <button
                                type="button"
                                className="route-stats__play"
                                onClick={() => playRouteAnimation()}
                                disabled={routeAnimation.playing}
                            >
                                {routeAnimation.playing ? "▶ Едет..." : "▶ Запустить машину"}
                            </button>
                            <button
                                type="button"
                                className="route-stats__reset"
                                onClick={() => resetRouteAnimation()}
                                title="Сбросить анимацию"
                                aria-label="Сбросить анимацию"
                            >
                                ↺
                            </button>
                        </div>

                        <div className="route-stats__speed">
                            <label>
                                Скорость: {routeAnimation.speed}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.5"
                                value={routeAnimation.speed}
                                onChange={(e) => setRouteAnimation({ speed: Number(e.target.value) })}
                            />
                        </div>

                        <div className="route-stats__progress">
                            <div
                                className="route-stats__progress-fill"
                                style={{
                                    width: `${routeAnimation.progress * 100}%`,
                                    background: branchInfo.color ?? "#e53935"
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="route-logistician">
                    <label htmlFor="route-logistician-select">Логист</label>
                    <select
                        id="route-logistician-select"
                        value={selectedBranch.logisticianId != null ? String(selectedBranch.logisticianId) : ""}
                        onChange={(e) => {
                            const newId = Number(e.target.value);
                            if (newId) assignBranchToLogistician(selectedBranch.id, newId);
                        }}
                    >
                        <option value="">— не назначен —</option>
                        {(logisticians ?? []).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>

                <h4 className="inspector__subtitle">Остановки маршрута</h4>

                <EditableRouteList
                    branchId={selectedBranch.id}
                    villageIds={selectedBranch.villageIds ?? []}
                    hubKato={selectedBranch.hubKato}
                    canEdit={canEdit}
                />
            </aside>
        );
    }

    if (selectedHub && activeTab === "hubs") {
        return (
            <HubInspector
                hub={selectedHub}
                villages={villages}
                branches={branches}
                selectedVillage={selectedVillage}
                overrides={villageCoordinateOverrides}
                onSelectVillage={selectVillage}
            />
        );
    }

    if (activeTab === "logistics") {
        if (selectedLogistician) {
            return (
                <LogisticianInspector
                    logistician={selectedLogistician}
                    branches={branches}
                />
            );
        }

        return <EmptyInspector />;
    }

    if (selectedVillage) {
        return (
            <VillageInspector
                village={selectedVillage}
                hubs={hubs}
                overrides={villageCoordinateOverrides}
                coordinateEditMode={coordinateEditMode}
                setCoordinateEditMode={setCoordinateEditMode}
                setVillageCoordinate={setVillageCoordinate}
                resetVillageCoordinate={resetVillageCoordinate}
                updateVillageHub={updateVillageHub}
                canEdit={canEdit}
            />
        );
    }

    return <EmptyInspector />;
}

export default Inspector;

function LogisticianInspector({ logistician, branches }) {
    const stats = getLogisticianStats(logistician, branches);

    return (
        <aside className="inspector">
            <h2 className="inspector__title">Логист</h2>

            <div className="logistician-card">
                <div className="logistician-card__name">{logistician.name}</div>

                <div className="logistician-card__stats">
                    <div className="logistician-card__stat">
                        <span className="logistician-card__stat-value">{stats.hubsCount}</span>
                        <span className="logistician-card__stat-label">Хабов</span>
                    </div>
                    <div className="logistician-card__stat">
                        <span className="logistician-card__stat-value">{stats.branchesCount}</span>
                        <span className="logistician-card__stat-label">Веток</span>
                    </div>
                    <div className="logistician-card__stat">
                        <span className="logistician-card__stat-value">{stats.villagesCount}</span>
                        <span className="logistician-card__stat-label">НП</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function HubInspector({ hub, villages, branches, selectedVillage, overrides, onSelectVillage }) {
    const [search, setSearch] = useState("");
    const selectedRef = useRef(null);

    const activeVillageIds = useMemo(() => {
        const ids = new Set();
        (branches ?? []).forEach(branch => {
            (branch.villageIds ?? []).forEach(id => ids.add(id));
        });
        return ids;
    }, [branches]);

    const hubVillages = useMemo(
        () => (villages ?? []).filter(v => v.hubKato === hub.kato),
        [villages, hub.kato]
    );

    const filteredVillages = hubVillages.filter(village =>
        village.name.toLowerCase().includes(search.toLowerCase()) ||
        (village.fullName ?? "").toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedVillage?.kato]);

    return (
        <aside className="inspector">
            <h2>{hub.name}</h2>
            <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
                {hubVillages.length} населённых пунктов
            </p>

            <input
                type="text"
                placeholder="Поиск села..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: "100%",
                    padding: "8px 10px",
                    marginBottom: 10,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: 13
                }}
            />

            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                Показано: <strong>{filteredVillages.length}</strong>
            </div>

            <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
                {filteredVillages.length === 0 && (
                    <p style={{ color: "#999", fontSize: 13 }}>Ничего не найдено</p>
                )}

                {filteredVillages.map(village => {
                    const isSelected = selectedVillage?.kato === village.kato;
                    const isActive = activeVillageIds.has(village.id);
                    const coords = resolveVillageCoord(village.kato, overrides);
                    const hasCoords = Boolean(coords);

                    return (
                        <div
                            key={village.kato}
                            ref={isSelected ? selectedRef : null}
                            onClick={() => onSelectVillage(village)}
                            className={isSelected ? "hub-village-item selected" : "hub-village-item"}
                            style={{
                                padding: 8,
                                marginBottom: 6,
                                cursor: "pointer",
                                borderRadius: 6,
                                border: isSelected
                                    ? "2px solid #2d7ff9"
                                    : isActive
                                        ? "1px solid #a5d6a7"
                                        : "1px solid #ddd",
                                borderLeft: `4px solid ${isActive ? "#4caf50" : "#bdbdbd"}`,
                                background: isSelected ? "#eef5ff" : isActive ? "#f1f8e9" : "white",
                                color: "#333",
                                transition: "background 0.15s"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                                <strong style={{ fontSize: 13 }}>{village.name}</strong>
                                <span style={{
                                    fontSize: 10,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: isActive ? "#4caf50" : "#e0e0e0",
                                    color: isActive ? "white" : "#666",
                                    fontWeight: "bold",
                                    flexShrink: 0
                                }}>
                                    {isActive ? "активно" : "свободно"}
                                </span>
                            </div>
                            {!hasCoords && (
                                <small style={{ color: "#f44336" }}>Нет координат</small>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedVillage && selectedVillage.hubKato === hub.kato && (
                <div style={{
                    marginTop: 12,
                    padding: 10,
                    background: "#eef5ff",
                    borderRadius: 8,
                    border: "1px solid #90caf9",
                    fontSize: 13
                }}>
                    <strong>На карте:</strong> {selectedVillage.name}
                    {resolveVillageCoord(selectedVillage.kato, overrides) ? (
                        <div style={{ color: "#666", marginTop: 4, fontSize: 12 }}>
                            Кликните другое село или выберите хаб заново
                        </div>
                    ) : (
                        <div style={{ color: "#f44336", marginTop: 4, fontSize: 12 }}>
                            Координаты не заданы — маркер на карте не отображается
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}

function VillageInspector({
    village,
    hubs,
    overrides,
    coordinateEditMode,
    setCoordinateEditMode,
    setVillageCoordinate,
    resetVillageCoordinate,
    updateVillageHub,
    canEdit
}) {
    const coords = resolveVillageCoord(village.kato, overrides);
    const isOverridden = isCoordOverridden(village.kato, overrides);
    const hasBase = hasBaseVillageCoord(village.kato);

    const [latInput, setLatInput] = useState(coords?.lat?.toFixed(6) ?? "");
    const [lngInput, setLngInput] = useState(coords?.lng?.toFixed(6) ?? "");

    useEffect(() => {
        setLatInput(coords?.lat?.toFixed(6) ?? "");
        setLngInput(coords?.lng?.toFixed(6) ?? "");
    }, [coords?.lat, coords?.lng, village.kato]);

    const applyManual = () => {
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);
        if (!isNaN(lat) && !isNaN(lng)) {
            setVillageCoordinate(village.kato, lat, lng);
        }
    };

    return (
        <aside className="inspector">
            <h2>Информация</h2>
            <h3>{village.name}</h3>
            <p><strong>Полное название:</strong> {village.fullName}</p>
            <p><strong>КАТО:</strong> {village.kato}</p>

            <div style={{
                marginTop: 10,
                marginBottom: 10,
                padding: 10,
                background: "#f5f5f5",
                borderRadius: 8,
                border: "1px solid #ddd"
            }}>
                <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 13 }}>
                    📍 Хаб
                </div>
                <select
                    value={village.hubKato || ""}
                    onChange={(e) => updateVillageHub(village.kato, e.target.value)}
                    disabled={!canEdit}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontSize: 13,
                        background: canEdit ? "white" : "#f5f5f5",
                        cursor: canEdit ? "pointer" : "not-allowed"
                    }}
                >
                    <option value="" disabled>Выберите хаб...</option>
                    {(hubs ?? []).map(hub => (
                        <option key={hub.kato} value={hub.kato}>
                            {hub.name}
                        </option>
                    ))}
                </select>
                {village.isEdited && (
                    <p style={{ fontSize: 11, color: "#9c27b0", marginTop: 6, marginBottom: 0 }}>
                        ✎ Хаб изменён вручную
                    </p>
                )}
            </div>

            {coords ? (
                <p>
                    <strong>Координаты:</strong> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    {isOverridden && (
                        <span style={{ color: "#9c27b0", marginLeft: 6, fontSize: 12 }}>
                            (исправлено)
                        </span>
                    )}
                </p>
            ) : (
                <p style={{ color: "#f44336" }}>Координаты не заданы</p>
            )}

            {!canEdit && (
                <p style={{ fontSize: 12, color: "#e65100", marginBottom: 10 }}>
                    Редактирование доступно после входа.
                </p>
            )}

            {canEdit && (
            <div style={{
                marginTop: 12,
                padding: 10,
                background: coordinateEditMode ? "#e3f2fd" : "#f5f5f5",
                borderRadius: 8,
                border: coordinateEditMode ? "2px solid #1976d2" : "1px solid #ddd"
            }}>
                <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 13 }}>
                    📍 Координаты
                </div>

                <button
                    onClick={() => setCoordinateEditMode(!coordinateEditMode)}
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        marginBottom: 8,
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: "bold",
                        background: coordinateEditMode ? "#1976d2" : "#fc912d",
                        color: "white",
                        fontSize: 13
                    }}
                >
                    {coordinateEditMode
                        ? "✓ Режим правки активен"
                        : coords
                            ? "📍 Исправить на карте"
                            : "📍 Указать на карте"}
                </button>

                {coordinateEditMode && (
                    <p style={{ fontSize: 12, color: "#1976d2", margin: "0 0 8px" }}>
                        Перетащите маркер 📍 или кликните на карте в нужное место
                    </p>
                )}

                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input
                        type="text"
                        placeholder="Широта"
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: "1px solid #ccc", fontSize: 13 }}
                    />
                    <input
                        type="text"
                        placeholder="Долгота"
                        value={lngInput}
                        onChange={(e) => setLngInput(e.target.value)}
                        style={{ flex: 1, padding: "6px 8px", borderRadius: 4, border: "1px solid #ccc", fontSize: 13 }}
                    />
                </div>
                <button
                    onClick={applyManual}
                    style={{
                        width: "100%",
                        padding: "6px",
                        border: "none",
                        borderRadius: 4,
                        background: "#4caf50",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 12,
                        marginBottom: 6
                    }}
                >
                    Применить координаты
                </button>

                {isOverridden && (
                    <button
                        onClick={() => {
                            resetVillageCoordinate(village.kato);
                            setCoordinateEditMode(false);
                        }}
                        style={{
                            width: "100%",
                            padding: "6px",
                            border: "none",
                            borderRadius: 4,
                            background: "#e0e0e0",
                            cursor: "pointer",
                            fontSize: 12
                        }}
                    >
                        ↺ Сбросить к исходным
                    </button>
                )}

                {!hasBase && !isOverridden && (
                    <p style={{ fontSize: 11, color: "#888", marginTop: 6, marginBottom: 0 }}>
                        В базе нет координат — укажите вручную
                    </p>
                )}
            </div>
            )}
        </aside>
    );
}
