import ImportExcel from "../ImportExcel/ImportExcel";
import DataBackup from "../ImportExcel/DataBackup";
import useAppStore from "../../store/appStore";

function ImportPanel() {
    const canEdit = useAppStore(state => state.canEdit);

    if (!canEdit) {
        return (
            <div>
                <h3 style={{ color: "#333", marginBottom: 12 }}>Импорт данных</h3>
                <div style={{
                    padding: 16,
                    background: "#fff3e0",
                    borderRadius: 8,
                    border: "1px solid #ffb74d",
                    fontSize: 13,
                    color: "#333",
                    lineHeight: 1.5
                }}>
                    Импорт и бэкап доступны только после входа.
                    Нажмите «Войти» в шапке сайта.
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 style={{ color: "#333", marginBottom: 12 }}>Импорт данных</h3>

            <div style={{
                padding: 12,
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #ddd",
                marginBottom: 4
            }}>
                <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 13, color: "#333" }}>
                    📥 Импорт из Excel
                </div>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                    Загрузить хабы и сёла из .xlsx — ветки будут построены автоматически.
                </p>
                <ImportExcel />
            </div>

            <DataBackup />
        </div>
    );
}

export default ImportPanel;
