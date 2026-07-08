import { useState, useEffect } from "react";

function BranchNameEditor({ branchId, name, onSave, compact = false }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(name);

    useEffect(() => {
        setValue(name);
    }, [name]);

    const save = () => {
        const trimmed = value.trim();
        if (trimmed) onSave(branchId, trimmed);
        setEditing(false);
    };

    const cancel = () => {
        setValue(name);
        setEditing(false);
    };

    if (editing) {
        return (
            <div
                style={{ display: "flex", gap: 4, alignItems: "center", flex: 1 }}
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") save();
                        if (e.key === "Escape") cancel();
                    }}
                    autoFocus
                    style={{
                        flex: 1,
                        padding: compact ? "2px 6px" : "4px 8px",
                        borderRadius: 4,
                        border: "1px solid #2196f3",
                        fontSize: compact ? 12 : 14,
                        fontWeight: "bold",
                        color: "#333"
                    }}
                />
                <button
                    onClick={save}
                    style={{
                        padding: "2px 6px",
                        border: "none",
                        borderRadius: 4,
                        background: "#4caf50",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 12
                    }}
                >
                    ✓
                </button>
                <button
                    onClick={cancel}
                    style={{
                        padding: "2px 6px",
                        border: "none",
                        borderRadius: 4,
                        background: "#e0e0e0",
                        cursor: "pointer",
                        fontSize: 12
                    }}
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div
            style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}
            onClick={(e) => e.stopPropagation()}
        >
            <strong style={{ fontSize: compact ? 13 : 16 }}>{name}</strong>
            <button
                onClick={() => setEditing(true)}
                title="Переименовать"
                style={{
                    padding: "1px 5px",
                    border: "none",
                    borderRadius: 4,
                    background: "#e0e0e0",
                    cursor: "pointer",
                    fontSize: 11,
                    lineHeight: 1.4
                }}
            >
                ✏️
            </button>
        </div>
    );
}

export default BranchNameEditor;
