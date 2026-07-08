import { useState } from "react";
import { readExcel } from "../../services/excelService";
import { normalizeExcel } from "../../services/normalizeExcel";
import useAppStore from "../../store/appStore";
import buildBranches from "../../algorithms/buildBranches";
import buildLogisticians from "../../algorithms/buildLogisticians";
import { persistAppData } from "../../services/dataSyncService";

function ImportExcel() {
    const { loadData } = useAppStore();
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    async function handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        setError("");
        setStatus("");

        try {
            const rows = await readExcel(file);
            const data = normalizeExcel(rows);

            const branches = buildBranches(data.hubs, data.villages);
            const logisticians = buildLogisticians(branches);

            const appData = {
                ...data,
                branches,
                logisticians,
                villageCoordinateOverrides: {}
            };

            loadData(appData);
            const result = await persistAppData(appData);

            setStatus(
                result.mode === "cloud"
                    ? "Excel импортирован и синхронизирован"
                    : "Excel импортирован локально"
            );
        } catch (err) {
            setError(err.message || "Ошибка импорта Excel");
        } finally {
            event.target.value = "";
        }
    }

    return (
        <div>
            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
            />
            {status && (
                <p style={{ fontSize: 12, color: "#2e7d32", marginTop: 8, marginBottom: 0 }}>
                    {status}
                </p>
            )}
            {error && (
                <p style={{ fontSize: 12, color: "#c62828", marginTop: 8, marginBottom: 0 }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export default ImportExcel;
