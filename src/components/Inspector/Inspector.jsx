import { useState, useEffect, useMemo, useRef } from "react";
import useAppStore from "../../store/appStore";
import hubCoordinates from "../../data/hubCoordinates";
import { resolveVillageCoord, isCoordOverridden, hasBaseVillageCoord } from "../../services/coordinatesService";
import { enrichBranch } from "../../utils/branchUtils";
import EditableRouteList from "./EditableRouteList";
import BranchNameEditor from "../Sidebar/BranchNameEditor";

function Inspector() {
    const {
        selectedBranch,
        selectedVillage,
        selectedHub,
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

        const endVillage = villages.find(v => v.kato === branchInfo.endPointKato);

        return (
            <aside className="inspector">
                <h2>Маршрут</h2>
                <BranchNameEditor
                    branchId={selectedBranch.id}
                    name={branchInfo.name}
                    onSave={updateBranchName}
                />
                <p><strong>Хаб:</strong> {hub?.name}</p>

                {branchInfo.exitIndex && (
                    <p><strong>🚪 Выезд (А):</strong> #{branchInfo.exitIndex} ({branchInfo.exitBearing}°)</p>
                )}

                {endVillage && (
                    <p><strong>🏁 Точка Б:</strong> {endVillage.name}</p>
                )}

                {routeLoading && (
                    <p style={{ color: "#1976d2", fontWeight: "bold", fontSize: 13 }}>
                        🛣️ Перестраиваем маршрут...
                    </p>
                )}

                {branchRouteData && (
                    <div style={{
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 12,
                        fontSize: 13
                    }}>
                        <div><strong>Расстояние:</strong> {(branchRouteData.distance / 1000).toFixed(1)} км</div>
                        <div><strong>Время:</strong> {formatDuration(branchRouteData.duration)}</div>

                        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                            <button
                                onClick={() => playRouteAnimation()}
                                disabled={routeAnimation.playing}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: routeAnimation.playing ? "#ccc" : "#4caf50",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: routeAnimation.playing ? "default" : "pointer"
                                }}
                            >
                                {routeAnimation.playing ? "▶ Едет..." : "▶ Запустить машину"}
                            </button>
                            <button
                                onClick={() => resetRouteAnimation()}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: "#e0e0e0",
                                    cursor: "pointer",
                                    fontWeight: "bold"
                                }}
                            >
                                ↺
                            </button>
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <label style={{ fontSize: 12, color: "#666" }}>
                                Скорость: {routeAnimation.speed}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.5"
                                value={routeAnimation.speed}
                                onChange={(e) => setRouteAnimation({ speed: Number(e.target.value) })}
                                style={{ width: "100%" }}
                            />
                        </div>

                        <div style={{ marginTop: 6, height: 4, background: "#eee", borderRadius: 2 }}>
                            <div style={{
                                height: "100%",
                                width: `${routeAnimation.progress * 100}%`,
                                background: branchInfo.color ?? "#e53935",
                                borderRadius: 2
                            }} />
                        </div>
                    </div>
                )}

                <p>
                    <strong>Логист: </strong>
                    <select
                        value={selectedBranch.logisticianId != null ? String(selectedBranch.logisticianId) : ""}
                        onChange={(e) => {
                            const newId = Number(e.target.value);
                            if (newId) assignBranchToLogistician(selectedBranch.id, newId);
                        }}
                        style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #ccc",
                            fontSize: 14,
                            background: "white",
                            cursor: "pointer"
                        }}
                    >
                        <option value="">— не назначен —</option>
                        {(logisticians ?? []).map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </p>

                <hr />

                <h4>Остановки маршрута</h4>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                    Нажмите на село — карта перейдёт к точке, строка подсветится синим.
                </p>

                {selectedBranch && (
                    <div style={{
                        display: "flex",
                        gap: 12,
                        fontSize: 11,
                        color: "#666",
                        marginBottom: 8,
                        padding: "6px 8px",
                        background: "#f5f5f5",
                        borderRadius: 6
                    }}>
                        <span>
                            <span style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#4caf50",
                                marginRight: 4,
                                verticalAlign: "middle"
                            }} />
                            Эта ветка
                        </span>
                        <span>
                            <span style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#2e7d32",
                                marginRight: 4,
                                verticalAlign: "middle"
                            }} />
                            Другая ветка
                        </span>
                        <span>
                            <span style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#bdbdbd",
                                marginRight: 4,
                                verticalAlign: "middle"
                            }} />
                            Свободно
                        </span>
                        <span>
                            <span style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#f44336",
                                marginRight: 4,
                                verticalAlign: "middle"
                            }} />
                            Точка Б
                        </span>
                    </div>
                )}

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

    return (
        <aside className="inspector">
            <h2>Маршрут</h2>
            <p>Выберите хаб и ветку слева</p>
        </aside>
    );
}

export default Inspector;

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
