import { useState } from "react";
import useAppStore from "../../store/appStore";

function LogisticPanel() {

    const {
        logisticians,
        branches,
        selectedLogistician,
        selectLogistician,
        updateLogisticianName,
        addLogistician
    } = useAppStore();

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [newName, setNewName] = useState("");

    const startEdit = (logistician) => {
        setEditingId(logistician.id);
        setEditName(logistician.name);
    };

    const saveEdit = (id) => {
        if (editName.trim()) {
            updateLogisticianName(id, editName.trim());
        }
        setEditingId(null);
    };

    const handleAdd = () => {
        if (newName.trim()) {
            addLogistician(newName.trim());
            setNewName("");
        }
    };

    const getLogisticianStats = (logistician) => {
        const logBranches = branches.filter(b => b.logisticianId === logistician.id);
        const hubKatos = new Set(logBranches.map(b => b.hubKato));
        const totalVillages = logBranches.reduce((sum, b) => sum + (b.totalStops || 0), 0);
        return {
            hubsCount: hubKatos.size,
            branchesCount: logBranches.length,
            villagesCount: totalVillages
        };
    };

    return (

        <div>

            <h3>Логисты</h3>

            <div
                style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    background: "#f5f5f5",
                    borderRadius: 6,
                    fontWeight: "bold"
                }}
            >
                Всего логистов: {logisticians.length}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    type="text"
                    placeholder="Имя нового логиста..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontSize: 14
                    }}
                />
                <button
                    onClick={handleAdd}
                    style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "#4caf50",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer"
                    }}
                >
                    +
                </button>
            </div>

            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {logisticians.map((logistician) => {
                    const stats = getLogisticianStats(logistician);
                    const isSelected = selectedLogistician?.id === logistician.id;

                    return (
                        <div
                            key={logistician.id}
                            onClick={() => selectLogistician(logistician)}
                            style={{
                                marginBottom: 12,
                                padding: 10,
                                borderRadius: 8,
                                cursor: "pointer",
                                border: isSelected
                                    ? "2px solid #2d7ff9"
                                    : "1px solid #ddd",
                                background: isSelected
                                    ? "#eef5ff"
                                    : "#fff"
                            }}
                        >
                            {editingId === logistician.id ? (
                                <div
                                    style={{ display: "flex", gap: 6 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveEdit(logistician.id);
                                            if (e.key === "Escape") setEditingId(null);
                                        }}
                                        autoFocus
                                        style={{
                                            flex: 1,
                                            padding: "4px 8px",
                                            borderRadius: 4,
                                            border: "1px solid #2d7ff9",
                                            fontSize: 14
                                        }}
                                    />
                                    <button
                                        onClick={() => saveEdit(logistician.id)}
                                        style={{
                                            padding: "4px 8px",
                                            border: "none",
                                            borderRadius: 4,
                                            background: "#4caf50",
                                            color: "white",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        style={{
                                            padding: "4px 8px",
                                            border: "none",
                                            borderRadius: 4,
                                            background: "#999",
                                            color: "white",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <strong>{logistician.name}</strong>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(logistician);
                                        }}
                                        style={{
                                            padding: "2px 8px",
                                            border: "none",
                                            borderRadius: 4,
                                            background: "#e0e0e0",
                                            cursor: "pointer",
                                            fontSize: 12
                                        }}
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}

                            <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
                                <div>Хабов: {stats.hubsCount}</div>
                                <div>Веток: {stats.branchesCount}</div>
                                <div>Населённых пунктов: {stats.villagesCount}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

    );

}

export default LogisticPanel;
