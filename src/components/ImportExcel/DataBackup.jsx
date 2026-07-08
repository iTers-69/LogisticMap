import { useRef, useState } from "react";
import useAppStore from "../../store/appStore";
import { downloadBackup, parseBackupFile } from "../../services/backupService";
import { persistAppData } from "../../services/dataSyncService";

function DataBackup() {
    const state = useAppStore();
    const fileRef = useRef(null);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const stats = {
        hubs: (state.hubs ?? []).length,
        villages: (state.villages ?? []).length,
        branches: (state.branches ?? []).length,
        logisticians: (state.logisticians ?? []).length
    };

    const handleExport = () => {
        setError("");
        setStatus("");
        downloadBackup(state);
        setStatus("Файл сохранён на компьютер");
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError("");
        setStatus("");

        const confirmed = window.confirm(
            "Заменить текущие данные содержимым файла?\n\n"
            + "Это обновит хабы, сёла, ветки и логистов для всех пользователей (Supabase)."
        );

        if (!confirmed) {
            event.target.value = "";
            return;
        }

        try {
            const text = await file.text();
            const { data, exportedAt } = parseBackupFile(text);

            state.loadData(data);
            const result = await persistAppData(data);

            const dateLabel = exportedAt
                ? new Date(exportedAt).toLocaleString("ru-RU")
                : "неизвестно";

            if (result.ok && result.mode === "cloud") {
                setStatus(`Импортировано и синхронизировано (бэкап от ${dateLabel})`);
            } else if (result.ok) {
                setStatus(`Импортировано локально (бэкап от ${dateLabel})`);
            } else {
                setStatus(`Импортировано локально, облако недоступно (бэкап от ${dateLabel})`);
            }
        } catch (err) {
            setError(err.message || "Не удалось импортировать файл");
        } finally {
            event.target.value = "";
        }
    };

    return (
        <div style={{
            marginTop: 16,
            padding: 12,
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #ddd"
        }}>
            <div style={{ fontWeight: "bold", marginBottom: 8, color: "#333" }}>
                💾 Бэкап / восстановление
            </div>

            <p style={{ fontSize: 12, color: "#666", marginBottom: 10, lineHeight: 1.4 }}>
                Сохраните текущие ветки и правки в файл или восстановите из ранее сохранённого бэкапа.
            </p>

            <div style={{
                fontSize: 12,
                color: "#555",
                marginBottom: 12,
                padding: "8px 10px",
                background: "#f5f5f5",
                borderRadius: 6
            }}>
                Сейчас: {stats.hubs} хабов · {stats.villages} сёл · {stats.branches} веток · {stats.logisticians} логистов
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                    type="button"
                    onClick={handleExport}
                    style={{
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: 6,
                        background: "#1976d2",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: 13
                    }}
                >
                    ⬇ Экспорт в JSON
                </button>

                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                        padding: "10px 12px",
                        border: "none",
                        borderRadius: 6,
                        background: "#4caf50",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: 13
                    }}
                >
                    ⬆ Импорт из JSON
                </button>

                <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImport}
                    style={{ display: "none" }}
                />
            </div>

            {status && (
                <p style={{ fontSize: 12, color: "#2e7d32", marginTop: 10, marginBottom: 0 }}>
                    {status}
                </p>
            )}

            {error && (
                <p style={{ fontSize: 12, color: "#c62828", marginTop: 10, marginBottom: 0 }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export default DataBackup;
