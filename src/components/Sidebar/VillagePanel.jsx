import { useState, useEffect, useRef, useMemo } from "react";
import useAppStore from "../../store/appStore";
import { getHubAssignmentIssues, getRegionFromFullName } from "../../services/hubAssignmentService";
import { getCoordinateIssueMap } from "../../services/coordinateValidationService";
import { baseCoordinates } from "../../services/coordinatesService";
import { geocodeVillage } from "../../services/geocodeService";
import { persistAppData } from "../../services/dataSyncService";

function VillagePanel() {
    const {
        villages,
        branches,
        hubs,
        selectedVillage,
        selectVillage,
        fixVillageHubsByRegion,
        villageCoordinateOverrides,
        setVillageCoordinate,
        canEdit
    } = useAppStore();

    const [search, setSearch] = useState("");
    const [fillFilter, setFillFilter] = useState("all");
    const [hubFilter, setHubFilter] = useState("all");
    const [fixStatus, setFixStatus] = useState("");
    const [geocodeProgress, setGeocodeProgress] = useState(null);
    const selectedRef = useRef(null);

    const hubIssues = useMemo(
        () => getHubAssignmentIssues(villages ?? [], hubs ?? []),
        [villages, hubs]
    );

    const coordinateIssueMap = useMemo(
        () => getCoordinateIssueMap(villages ?? [], villageCoordinateOverrides ?? {}, baseCoordinates),
        [villages, villageCoordinateOverrides]
    );

    const activeVillageIds = useMemo(() => {
        const ids = new Set();
        (branches ?? []).forEach(branch => {
            (branch.villageIds ?? []).forEach(id => ids.add(id));
        });
        return ids;
    }, [branches]);

    const stats = useMemo(() => {
        const total = (villages ?? []).length;
        let active = 0;
        (villages ?? []).forEach(v => {
            if (activeVillageIds.has(v.id)) active++;
        });
        return { total, active, inactive: total - active };
    }, [villages, activeVillageIds]);

    const filteredVillages = (villages ?? []).filter(village => {
        const region = getRegionFromFullName(village.fullName);
        const matchesSearch =
            village.name.toLowerCase().includes(search.toLowerCase()) ||
            (village.hubName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            region.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (hubFilter !== "all" && village.hubKato !== hubFilter) return false;

        const isActive = activeVillageIds.has(village.id);
        if (fillFilter === "active") return isActive;
        if (fillFilter === "inactive") return !isActive;
        return true;
    });

    const handleFixHubs = async () => {
        if (!canEdit) return;
        if (hubIssues.length === 0) {
            setFixStatus("Все сёла уже привязаны к верным хабам");
            return;
        }

        const confirmed = window.confirm(
            `Исправить привязку для ${hubIssues.length} сёл?\n\n`
            + "Сёла будут распределены по хабам согласно области из адреса "
            + "(например, Акмолинская → Астана)."
        );

        if (!confirmed) return;

        fixVillageHubsByRegion();

        const state = useAppStore.getState();
        await persistAppData({
            hubs: state.hubs,
            villages: state.villages,
            branches: state.branches,
            logisticians: state.logisticians,
            villageCoordinateOverrides: state.villageCoordinateOverrides
        });

        setFixStatus(`Исправлено ${hubIssues.length} сёл — сохранено в облако`);
    };

    const handleRegeocodeOne = async (village) => {
        if (!canEdit) return;
        setGeocodeProgress({ current: 0, total: 1, name: village.name });

        const result = await geocodeVillage(village, { delayMs: 0, maxDistanceKm: 450 });

        if (result.ok) {
            setVillageCoordinate(village.kato, result.lat, result.lng);
            const state = useAppStore.getState();
            await persistAppData({
                hubs: state.hubs,
                villages: state.villages,
                branches: state.branches,
                logisticians: state.logisticians,
                villageCoordinateOverrides: state.villageCoordinateOverrides
            });
            selectVillage(village);
            setFixStatus(`${village.name}: координаты обновлены (${result.distanceKm} км)`);
        } else {
            setFixStatus(`${village.name}: ${result.error}`);
        }

        setGeocodeProgress(null);
    };

    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [selectedVillage?.kato]);

    const filters = [
        { id: "all", label: "Все", count: stats.total },
        { id: "active", label: "Активные", count: stats.active },
        { id: "inactive", label: "Неактивные", count: stats.inactive }
    ];

    return (
        <div>
            <h3 style={{ color: "#333", marginBottom: 10 }}>Сёла</h3>

            <div style={{
                marginBottom: 10,
                padding: "10px 12px",
                background: "#f5f5f5",
                borderRadius: 8,
                fontSize: 13,
                color: "#333"
            }}>
                <div style={{ fontWeight: "bold", marginBottom: 6 }}>Заполнение маршрутов</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>
                        <span style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#4caf50",
                            marginRight: 4
                        }} />
                        Активные: <strong>{stats.active}</strong>
                    </span>
                    <span>
                        <span style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#bdbdbd",
                            marginRight: 4
                        }} />
                        Неактивные: <strong>{stats.inactive}</strong>
                    </span>
                </div>
                {stats.total > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <div style={{
                            height: 6,
                            background: "#e0e0e0",
                            borderRadius: 3,
                            overflow: "hidden"
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${(stats.active / stats.total) * 100}%`,
                                background: "#4caf50",
                                borderRadius: 3
                            }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                            {Math.round((stats.active / stats.total) * 100)}% в маршрутах
                        </div>
                    </div>
                )}
            </div>

            {canEdit && hubIssues.length > 0 && (
                <div style={{
                    marginBottom: 10,
                    padding: "10px 12px",
                    background: "#fff3e0",
                    borderRadius: 8,
                    border: "1px solid #ffb74d",
                    fontSize: 12,
                    color: "#333"
                }}>
                    <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                        ⚠ Неверная привязка: {hubIssues.length} сёл
                    </div>
                    <div style={{ color: "#666", marginBottom: 8, lineHeight: 1.4 }}>
                        Например, сёла Акмолинской области не в хабе Астана.
                    </div>
                    <button
                        type="button"
                        onClick={handleFixHubs}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: "none",
                            borderRadius: 6,
                            background: "#ff9800",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                            fontSize: 12
                        }}
                    >
                        Исправить привязку к хабам
                    </button>
                    {fixStatus && (
                        <p style={{ marginTop: 8, marginBottom: 0, color: "#2e7d32" }}>
                            {fixStatus}
                        </p>
                    )}
                </div>
            )}

            <div style={{ marginBottom: 10 }}>
                <select
                    value={hubFilter}
                    onChange={(e) => setHubFilter(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontSize: 13,
                        color: "#333",
                        background: "white"
                    }}
                >
                    <option value="all">Все хабы</option>
                    {(hubs ?? []).map(hub => (
                        <option key={hub.kato} value={hub.kato}>
                            {hub.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {filters.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFillFilter(f.id)}
                        style={{
                            flex: 1,
                            padding: "6px 4px",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: fillFilter === f.id ? "bold" : "normal",
                            background: fillFilter === f.id ? "#fc912d" : "#ddd",
                            color: "#333"
                        }}
                    >
                        {f.label}
                        <br />
                        <span style={{ fontSize: 10 }}>({f.count})</span>
                    </button>
                ))}
            </div>

            <input
                type="text"
                placeholder="Поиск по названию или хабу..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: "100%",
                    padding: 8,
                    marginBottom: 10,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    color: "#333"
                }}
            />

            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                Показано: <strong>{filteredVillages.length}</strong>
            </div>

            <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
                {filteredVillages.length === 0 && (
                    <p style={{ color: "#999", fontSize: 13 }}>
                        {fillFilter === "active" && "Нет активных сёл в маршрутах"}
                        {fillFilter === "inactive" && "Все сёла уже в маршрутах"}
                        {fillFilter === "all" && "Ничего не найдено"}
                    </p>
                )}

                {filteredVillages.map(village => {
                    const isSelected = selectedVillage?.kato === village.kato;
                    const isActive = activeVillageIds.has(village.id);
                    const coordIssue = coordinateIssueMap.get(String(village.kato));

                    return (
                        <div
                            key={village.kato}
                            ref={isSelected ? selectedRef : null}
                            onClick={() => selectVillage(village)}
                            style={{
                                padding: 8,
                                marginBottom: 6,
                                cursor: "pointer",
                                borderRadius: 6,
                                border: isSelected
                                    ? "2px solid #1976d2"
                                    : coordIssue?.severity === "critical"
                                        ? "1px solid #ef5350"
                                        : isActive
                                            ? "1px solid #a5d6a7"
                                            : "1px solid #ddd",
                                borderLeft: `4px solid ${
                                    coordIssue
                                        ? (coordIssue.severity === "critical" ? "#e53935" : "#ff9800")
                                        : (isActive ? "#4caf50" : "#bdbdbd")
                                }`,
                                background: isSelected ? "#E3F2FD" : isActive ? "#f1f8e9" : "white",
                                color: "#333",
                                transition: "background 0.15s"
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = isActive ? "#e8f5e9" : "#f5f5f5";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.background = isActive ? "#f1f8e9" : "white";
                                }
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong>{village.name}</strong>
                                <span style={{
                                    fontSize: 10,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: coordIssue
                                        ? (coordIssue.severity === "critical" ? "#e53935" : "#ff9800")
                                        : (isActive ? "#4caf50" : "#e0e0e0"),
                                    color: coordIssue || isActive ? "white" : "#666",
                                    fontWeight: "bold"
                                }}>
                                    {coordIssue ? "ошибка" : (isActive ? "активно" : "свободно")}
                                </span>
                            </div>
                            <small style={{ color: "#666" }}>
                                {getRegionFromFullName(village.fullName)} · {village.hubName}
                            </small>
                            {coordIssue && (
                                <div style={{
                                    marginTop: 4,
                                    fontSize: 11,
                                    color: coordIssue.severity === "critical" ? "#c62828" : "#e65100"
                                }}>
                                    ⚠ {coordIssue.message}
                                </div>
                            )}
                            {canEdit && coordIssue && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRegeocodeOne(village);
                                    }}
                                    disabled={Boolean(geocodeProgress)}
                                    style={{
                                        marginTop: 6,
                                        padding: "4px 8px",
                                        border: "none",
                                        borderRadius: 4,
                                        background: "#1976d2",
                                        color: "white",
                                        fontSize: 10,
                                        cursor: geocodeProgress ? "wait" : "pointer"
                                    }}
                                >
                                    Перегеокодировать
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default VillagePanel;
