import { useState, useEffect } from "react";
import useAppStore from "../../store/appStore";
import { resolveVillageCoord } from "../../services/coordinatesService";
import hubCoordinates from "../../data/hubCoordinates";
import BranchNameEditor from "./BranchNameEditor";
import { persistAppData } from "../../services/dataSyncService";

function AutocompleteInput({ label, value, onChange, placeholder, pointsList }) {
    const [search, setSearch] = useState(value ? value.name : "");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setSearch(value ? value.name : "");
    }, [value]);

    const filtered = pointsList.filter(item =>
        (item.name ?? "").toLowerCase().includes((search ?? "").toLowerCase())
    ).slice(0, 10);

    return (
        <div style={{ position: "relative", marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px", color: "#555" }}>
                {label}
            </label>
            <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    outline: "none",
                    background: "white",
                    color: "black"
                }}
            />
            {isOpen && filtered.length > 0 && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 1000,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    marginTop: "4px"
                }}>
                    {filtered.map(item => (
                        <div
                            key={item.id}
                            onMouseDown={() => {
                                onChange(item);
                                setSearch(item.name);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: "8px 10px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                                fontSize: "13px",
                                textAlign: "left",
                                color: "black"
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function RoutePanel() {
    const {
        branches,
        hubs,
        villages,
        logisticians,
        selectedHub,
        selectedBranch,
        selectHub,
        selectBranch,
        customRouteStart,
        customRouteEnd,
        customRouteData,
        setCustomRouteStart,
        setCustomRouteEnd,
        clearCustomRoute,
        assignBranchToLogistician,
        addBranch,
        removeBranch,
        updateBranchName,
        rebuildHubBranches,
        rebuildAllHubBranches,
        canEdit,
        villageCoordinateOverrides
    } = useAppStore();

    const [mode, setMode] = useState("standard");

    useEffect(() => {
        if (customRouteStart || customRouteEnd) {
            setMode("custom");
        }
    }, [customRouteStart, customRouteEnd]);

    const hubBranches = selectedHub
        ? (branches ?? []).filter(b => b.hubKato === selectedHub.kato)
        : [];

    const buildPointsList = () => [
        ...(hubs ?? []).map(h => ({
            id: `hub-${h.id}`,
            name: `📍 Хаб: ${h.name}`,
            kato: h.kato,
            type: "hub",
            lat: hubCoordinates[h.kato]?.lat,
            lng: hubCoordinates[h.kato]?.lng,
            details: h
        })),
        ...(villages ?? []).map(v => ({
            id: `village-${v.kato}`,
            name: `🏘️ Село: ${v.name} (${v.hubName || "Без хаба"})`,
            kato: v.kato,
            type: "village",
            lat: resolveVillageCoord(v.kato, villageCoordinateOverrides)?.lat,
            lng: resolveVillageCoord(v.kato, villageCoordinateOverrides)?.lng,
            details: v
        }))
    ].filter(p => p.lat !== undefined && p.lng !== undefined);

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        let res = "";
        if (hrs > 0) res += `${hrs} ч `;
        if (hrs === 0 || mins > 0) res += `${mins} мин`;
        return res;
    };

    const handleRebuildHub = async () => {
        if (!selectedHub || !canEdit) return;

        const villageCount = (villages ?? []).filter(v => v.hubKato === selectedHub.kato).length;
        const confirmed = window.confirm(
            `Перестроить выезды для «${selectedHub.name}»?\n\n`
            + `Будет ~${Math.min(10, Math.max(4, Math.ceil(villageCount / 12)))} веток по секторам компаса. `
            + "Порядок сёл в ветках пересчитается — ручные правки маршрутов будут потеряны."
        );

        if (!confirmed) return;

        rebuildHubBranches(selectedHub.kato);

        // zustand set синхронный — сразу сохраняем с актуальными логистами
        const state = useAppStore.getState();
        await persistAppData({
            hubs: state.hubs,
            villages: state.villages,
            branches: state.branches,
            logisticians: state.logisticians,
            villageCoordinateOverrides: state.villageCoordinateOverrides
        });
    };

    const handleRebuildAll = async () => {
        if (!canEdit) return;

        const confirmed = window.confirm(
            "Перестроить выезды для ВСЕХ хабов?\n\n"
            + "Ветки всех городов будут пересчитаны по секторам. "
            + "Ручные правки маршрутов будут потеряны."
        );

        if (!confirmed) return;

        rebuildAllHubBranches();

        const state = useAppStore.getState();
        await persistAppData({
            hubs: state.hubs,
            villages: state.villages,
            branches: state.branches,
            logisticians: state.logisticians,
            villageCoordinateOverrides: state.villageCoordinateOverrides
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button
                    onClick={() => setMode("standard")}
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: mode === "standard" ? "#fc912d" : "#ddd",
                        color: "black",
                        fontWeight: "bold"
                    }}
                >
                    📋 Маршруты
                </button>
                <button
                    onClick={() => setMode("custom")}
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: mode === "custom" ? "#fc912d" : "#ddd",
                        color: "black",
                        fontWeight: "bold"
                    }}
                >
                    🗺️ Свой маршрут
                </button>
            </div>

            {mode === "standard" ? (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <div style={{ flex: 1, overflowY: "auto", marginBottom: 8 }}>
                        <h3 style={{ color: "#333", marginBottom: 8 }}>Маршруты</h3>
                        {(branches ?? []).length === 0 && (
                            <p style={{ color: "#333" }}>Сначала импортируйте Excel.</p>
                        )}
                        {selectedBranch && (
                            <div style={{
                                padding: 10,
                                background: "#e3f2fd",
                                borderRadius: 8,
                                border: "1px solid #2196f3",
                                fontSize: 13,
                                color: "#333"
                            }}>
                                <strong>Выбрано:</strong>{" "}
                                <BranchNameEditor
                                    branchId={selectedBranch.id}
                                    name={selectedBranch.name}
                                    onSave={updateBranchName}
                                />
                                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                    Редактируйте список сёл справа →
                                </div>
                            </div>
                        )}
                    </div>

                    {(hubs ?? []).length > 0 && (
                        <div style={{
                            borderTop: "2px solid #fc912d",
                            paddingTop: 12,
                            flexShrink: 0
                        }}>
                            <h4 style={{ color: "#333", marginBottom: 8 }}>📍 Хабы</h4>
                            <div style={{ maxHeight: "120px", overflowY: "auto", marginBottom: 12 }}>
                                {(hubs ?? []).map(hub => {
                                    const count = (branches ?? []).filter(b => b.hubKato === hub.kato).length;
                                    const isActive = selectedHub?.kato === hub.kato;
                                    return (
                                        <div
                                            key={hub.kato}
                                            onClick={() => selectHub(hub)}
                                            style={{
                                                padding: "8px 10px",
                                                marginBottom: 4,
                                                borderRadius: 6,
                                                cursor: "pointer",
                                                background: isActive ? "#fff3e0" : "#fff",
                                                border: isActive ? "2px solid #fc912d" : "1px solid #ddd",
                                                color: "#333",
                                                fontSize: 13
                                            }}
                                        >
                                            <strong>{hub.name}</strong>
                                            <span style={{ color: "#888", marginLeft: 6 }}>
                                                ({count} веток)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedHub && (
                                <>
                                    {canEdit && (
                                        <div style={{ marginBottom: 10 }}>
                                            <button
                                                type="button"
                                                onClick={handleRebuildHub}
                                                style={{
                                                    width: "100%",
                                                    padding: "8px 10px",
                                                    marginBottom: 6,
                                                    border: "none",
                                                    borderRadius: 6,
                                                    background: "#8B1538",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: 12,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                ⟳ Перестроить выезды (звезда)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRebuildAll}
                                                style={{
                                                    width: "100%",
                                                    padding: "6px 10px",
                                                    border: "1px solid #ccc",
                                                    borderRadius: 6,
                                                    background: "white",
                                                    color: "#666",
                                                    fontSize: 11,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Перестроить все хабы
                                            </button>
                                        </div>
                                    )}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 8
                                    }}>
                                        <h4 style={{ color: "#333", margin: 0 }}>
                                            🚚 Ветки — {selectedHub.name}
                                        </h4>
                                        <button
                                            onClick={() => addBranch(selectedHub.kato)}
                                            style={{
                                                padding: "4px 10px",
                                                borderRadius: 6,
                                                border: "none",
                                                background: "#4caf50",
                                                color: "white",
                                                fontWeight: "bold",
                                                fontSize: 12,
                                                cursor: "pointer"
                                            }}
                                        >
                                            + Ветка
                                        </button>
                                    </div>
                                    {hubBranches.length === 0 ? (
                                        <p style={{ fontSize: 13, color: "#666" }}>
                                            Нет веток — нажмите «+ Ветка»
                                        </p>
                                    ) : (
                                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                            {hubBranches.map(branch => (
                                                <div
                                                    key={branch.id}
                                                    onClick={() => selectBranch(branch)}
                                                    style={{
                                                        marginBottom: 8,
                                                        padding: 8,
                                                        borderRadius: 6,
                                                        cursor: "pointer",
                                                        background: selectedBranch?.id === branch.id
                                                            ? "#e3f2fd" : "#fff",
                                                        border: selectedBranch?.id === branch.id
                                                            ? "2px solid #2196f3" : "1px solid #ddd",
                                                        borderLeft: `4px solid ${branch.color ?? "#e53935"}`,
                                                        color: "#333",
                                                        fontSize: 13
                                                    }}
                                                >
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "flex-start"
                                                    }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <BranchNameEditor
                                                                branchId={branch.id}
                                                                name={branch.name}
                                                                onSave={updateBranchName}
                                                                compact
                                                            />
                                                            {branch.exitBearing != null && (
                                                                <span style={{ color: "#888", marginLeft: 6 }}>
                                                                    {branch.exitBearing}°
                                                                </span>
                                                            )}
                                                            <div style={{ fontSize: 12, color: "#666" }}>
                                                                {branch.totalStops} сёл
                                                                {branch.manualRoute && " · ✏️ изменён"}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Удалить ${branch.name}?`)) {
                                                                    removeBranch(branch.id);
                                                                }
                                                            }}
                                                            title="Удалить ветку"
                                                            style={{
                                                                padding: "2px 8px",
                                                                border: "none",
                                                                borderRadius: 4,
                                                                background: "#ffebee",
                                                                color: "#f44336",
                                                                cursor: "pointer",
                                                                fontSize: 14,
                                                                lineHeight: 1.4
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div
                                                        style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span style={{ fontSize: 11, color: "#777" }}>Логист:</span>
                                                        <select
                                                            value={branch.logisticianId != null ? String(branch.logisticianId) : ""}
                                                            onChange={(e) => {
                                                                const newId = Number(e.target.value);
                                                                if (newId) {
                                                                    assignBranchToLogistician(branch.id, newId);
                                                                }
                                                            }}
                                                            style={{
                                                                padding: "1px 4px",
                                                                borderRadius: 4,
                                                                border: "1px solid #ccc",
                                                                fontSize: 11,
                                                                background: "white"
                                                            }}
                                                        >
                                                            <option value="">—</option>
                                                            {(logisticians ?? []).map(l => (
                                                                <option key={l.id} value={l.id}>{l.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <h3 style={{ color: "#333" }}>Построить свой маршрут</h3>
                    <div style={{ marginTop: 12 }}>
                        <AutocompleteInput
                            label="Пункт А (Старт):"
                            placeholder="Введите название..."
                            value={customRouteStart}
                            onChange={setCustomRouteStart}
                            pointsList={buildPointsList()}
                        />
                        <AutocompleteInput
                            label="Пункт Б (Финиш):"
                            placeholder="Введите название..."
                            value={customRouteEnd}
                            onChange={setCustomRouteEnd}
                            pointsList={buildPointsList()}
                        />
                        {customRouteData && (
                            <div style={{
                                background: "#fff",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                padding: "12px",
                                marginTop: "16px"
                            }}>
                                <h4 style={{ color: "#2d7ff9", marginBottom: "8px" }}>Данные маршрута:</h4>
                                <div style={{ fontSize: "14px", marginBottom: "4px", color: "black" }}>
                                    <strong>Расстояние:</strong> {(customRouteData.distance / 1000).toFixed(1)} км
                                </div>
                                <div style={{ fontSize: "14px", color: "black" }}>
                                    <strong>Время в пути:</strong> {formatDuration(customRouteData.duration)}
                                </div>
                            </div>
                        )}
                        {(customRouteStart || customRouteEnd) && (
                            <button
                                onClick={clearCustomRoute}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    background: "#e0e0e0",
                                    border: "none",
                                    fontWeight: "bold",
                                    marginTop: "16px",
                                    color: "black"
                                }}
                            >
                                ❌ Сбросить выбор
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoutePanel;
