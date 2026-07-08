import { useState, useMemo } from "react";
import useAppStore from "../../store/appStore";
import { resolveVillageCoord } from "../../services/coordinatesService";
import { findVillageById, isSameVillageId } from "../../utils/villageId";

function EditableRouteList({ branchId, villageIds, hubKato, canEdit = true }) {
    const {
        villages,
        branches,
        updateBranchVillages,
        mapAddVillageMode,
        setMapAddVillageMode,
        villageCoordinateOverrides,
        selectedRouteStopId,
        selectRouteStop
    } = useAppStore();
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const [addSearch, setAddSearch] = useState("");

    const orderedVillages = (villageIds ?? [])
        .map(id => findVillageById(villages, id))
        .filter(Boolean);

    const lastId = villageIds?.[villageIds.length - 1];

    const usedInOtherBranches = useMemo(() => {
        const ids = new Set();
        (branches ?? [])
            .filter(b => b.hubKato === hubKato && b.id !== branchId)
            .forEach(b => (b.villageIds ?? []).forEach(id => ids.add(id)));
        return ids;
    }, [branches, hubKato, branchId]);

    const availableToAdd = (villages ?? []).filter(v =>
        v.hubKato === hubKato &&
        !(villageIds ?? []).includes(v.id) &&
        !usedInOtherBranches.has(v.id) &&
        resolveVillageCoord(v.kato, villageCoordinateOverrides)
    ).filter(v =>
        !addSearch ||
        v.name.toLowerCase().includes(addSearch.toLowerCase())
    ).slice(0, 8);

    const applyOrder = (newIds) => {
        updateBranchVillages(branchId, newIds);
    };

    const handleDragStart = (index) => {
        setDragIndex(index);
        setOverIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragIndex !== null) setOverIndex(index);
    };

    const handleDrop = (index) => {
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setOverIndex(null);
            return;
        }
        const newIds = [...villageIds];
        const [moved] = newIds.splice(dragIndex, 1);
        newIds.splice(index, 0, moved);
        applyOrder(newIds);
        setDragIndex(null);
        setOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setOverIndex(null);
    };

    const moveItem = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= villageIds.length) return;
        const newIds = [...villageIds];
        [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
        applyOrder(newIds);
    };

    const removeItem = (index) => {
        applyOrder(villageIds.filter((_, i) => i !== index));
    };

    const addVillage = (villageId) => {
        applyOrder([...(villageIds ?? []), villageId]);
        setAddSearch("");
    };

    return (
        <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                🚪 Выезд → промежуточные → 🏁 Точка Б (последняя)
            </div>

            <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {orderedVillages.length === 0 && (
                    <p style={{ color: "#999", fontSize: 13 }}>Список пуст — добавьте сёла</p>
                )}

                {orderedVillages.map((village, index) => {
                    const isEnd = isSameVillageId(village.id, lastId);
                    const isSelected = isSameVillageId(selectedRouteStopId, village.id);
                    const isDragging = dragIndex === index;
                    const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

                    const rowStyle = isDragging
                        ? { border: "1px solid #ddd", background: "#fff3e0" }
                        : isSelected
                        ? {
                            border: "2px solid #1976d2",
                            background: "#eef5ff"
                        }
                        : isEnd
                            ? { border: "2px solid #f44336", background: "#fff5f5" }
                            : isOver
                                ? { border: "2px dashed #1976d2", background: "#e3f2fd" }
                                : { border: "1px solid #ddd", background: "#fff" };

                    return (
                        <div
                            key={village.id}
                            draggable={canEdit}
                            onDragStart={canEdit ? () => handleDragStart(index) : undefined}
                            onDragOver={canEdit ? (e) => handleDragOver(e, index) : undefined}
                            onDrop={canEdit ? () => handleDrop(index) : undefined}
                            onDragEnd={canEdit ? handleDragEnd : undefined}
                            onClick={() => selectRouteStop(village.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 6px",
                                marginBottom: 4,
                                borderRadius: 6,
                                cursor: "pointer",
                                opacity: isDragging ? 0.5 : 1,
                                ...rowStyle
                            }}
                        >
                            {canEdit && (
                                <span
                                    style={{ color: "#999", fontSize: 12, width: 16, cursor: "grab" }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    ⠿
                                </span>
                            )}
                            <span style={{
                                minWidth: 20,
                                fontWeight: "bold",
                                fontSize: 12,
                                color: isSelected ? "#1565c0" : "#1976d2"
                            }}>
                                {index + 1}
                            </span>
                            <span style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: isSelected ? "bold" : "normal",
                                color: isSelected ? "#1565c0" : "inherit"
                            }}>
                                {village.name}
                                {isEnd && " 🏁"}
                            </span>
                            {canEdit && (
                                <>
                            <button
                                onClick={(e) => { e.stopPropagation(); moveItem(index, -1); }}
                                disabled={index === 0}
                                title="Вверх"
                                style={btnSmall}
                            >↑</button>
                            <button
                                onClick={(e) => { e.stopPropagation(); moveItem(index, 1); }}
                                disabled={index === villageIds.length - 1}
                                title="Вниз"
                                style={btnSmall}
                            >↓</button>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeItem(index); }}
                                title="Удалить"
                                style={{ ...btnSmall, color: "#f44336" }}
                            >✕</button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {canEdit && (
            <div style={{ marginTop: 12 }}>
                <button
                    onClick={() => setMapAddVillageMode(!mapAddVillageMode)}
                    style={{
                        width: "100%",
                        padding: "8px 12px",
                        marginBottom: 8,
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 13,
                        background: mapAddVillageMode ? "#1976d2" : "#e3f2fd",
                        color: mapAddVillageMode ? "white" : "#1976d2"
                    }}
                >
                    {mapAddVillageMode
                        ? "🗺️ Выбор на карте — нажмите на серую точку"
                        : "🗺️ Добавить село с карты"}
                </button>

                <input
                    type="text"
                    placeholder="Или найти по названию..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontSize: 13
                    }}
                />
                {addSearch && availableToAdd.length > 0 && (
                    <div style={{
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        marginTop: 4,
                        maxHeight: 160,
                        overflowY: "auto",
                        background: "#fff"
                    }}>
                        {availableToAdd.map(v => (
                            <div
                                key={v.kato}
                                onClick={() => addVillage(v.id)}
                                style={{
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #eee",
                                    fontSize: 13
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f0f0"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                            >
                                {v.name}
                            </div>
                        ))}
                    </div>
                )}
                {addSearch && availableToAdd.length === 0 && (
                    <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                        Нет доступных сёл для добавления
                    </p>
                )}
            </div>
            )}
        </div>
    );
}

const btnSmall = {
    padding: "2px 6px",
    border: "1px solid #ddd",
    borderRadius: 4,
    background: "#f5f5f5",
    cursor: "pointer",
    fontSize: 12,
    lineHeight: 1.4
};

export default EditableRouteList;
