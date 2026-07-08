import { useEffect, useRef } from "react";
import useAppStore from "./store/appStore";
import { saveData as saveLocalData } from "./services/storageService";
import { resolveInitialData, persistAppData } from "./services/dataSyncService";
import {
    subscribeCloudData,
    isCloudEnabled,
    normalizeAppData
} from "./services/cloudService";
import { ensureBranchOrderPreserved } from "./services/migrateAppData";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import Map from "./components/Map/Map";
import Inspector from "./components/Inspector/Inspector";
import LoginScreen from "./components/Auth/LoginScreen";

const SAVE_DEBOUNCE_MS = 1200;

function pickPersistPayload(state) {
    return normalizeAppData({
        hubs: state.hubs,
        villages: state.villages,
        branches: state.branches,
        logisticians: state.logisticians,
        villageCoordinateOverrides: state.villageCoordinateOverrides
    });
}

function App() {
    const {
        loadData,
        syncDataFromCloud,
        setDataLoading,
        setSyncStatus,
        dataLoading,
        initAuth,
        authRequired,
        canEdit,
        login
    } = useAppStore();

    const skipPersistRef = useRef(true);
    const applyingRemoteRef = useRef(false);
    const saveTimerRef = useRef(null);
    const ourLastSaveRef = useRef(0);
    const lastPayloadRef = useRef("");
    const dataInitializedRef = useRef(false);

    const hasAccess = !authRequired || canEdit;

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    useEffect(() => {
        if (!hasAccess) {
            dataInitializedRef.current = false;
            return;
        }

        let unsubscribeRealtime = () => {};

        async function init() {
            setDataLoading(true);
            setSyncStatus("loading");

            try {
                const result = await resolveInitialData();
                loadData(result.data);
                lastPayloadRef.current = JSON.stringify(normalizeAppData(result.data));
                dataInitializedRef.current = true;

                if (isCloudEnabled()) {
                    setSyncStatus("saved", result.updatedAt);
                } else {
                    setSyncStatus("offline");
                }
            } catch (error) {
                console.error("Ошибка инициализации данных:", error);
                setSyncStatus("error");
            } finally {
                skipPersistRef.current = false;
                setDataLoading(false);
            }

            if (isCloudEnabled()) {
                unsubscribeRealtime = subscribeCloudData((data, updatedAt) => {
                    if (Date.now() - ourLastSaveRef.current < 3000) return;

                    applyingRemoteRef.current = true;
                    syncDataFromCloud(ensureBranchOrderPreserved(data));
                    saveLocalData(data);
                    lastPayloadRef.current = JSON.stringify(data);
                    setSyncStatus("saved", updatedAt);

                    setTimeout(() => {
                        applyingRemoteRef.current = false;
                    }, 500);
                });
            }
        }

        if (!dataInitializedRef.current) {
            init();
        }

        return () => {
            unsubscribeRealtime();
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [hasAccess, loadData, setDataLoading, setSyncStatus, syncDataFromCloud]);

    useEffect(() => {
        if (!hasAccess) return;

        const unsubscribe = useAppStore.subscribe((state, prevState) => {
            if (skipPersistRef.current || applyingRemoteRef.current) return;
            if (!state.canEdit) return;

            const payload = pickPersistPayload(state);
            const prevPayload = pickPersistPayload(prevState);
            const serialized = JSON.stringify(payload);

            if (serialized === JSON.stringify(prevPayload)) return;
            if (serialized === lastPayloadRef.current) return;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            setSyncStatus("saving");

            saveTimerRef.current = setTimeout(async () => {
                if (applyingRemoteRef.current) return;

                const result = await persistAppData(payload);
                ourLastSaveRef.current = Date.now();
                lastPayloadRef.current = serialized;

                if (result.ok) {
                    setSyncStatus(result.mode === "cloud" ? "saved" : "offline");
                } else {
                    setSyncStatus("error");
                }
            }, SAVE_DEBOUNCE_MS);
        });

        return () => {
            unsubscribe();
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [hasAccess, setSyncStatus]);

    if (!hasAccess) {
        return <LoginScreen onLogin={login} />;
    }

    if (dataLoading) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                background: "#f5f5f5",
                color: "#333"
            }}>
                <div style={{ fontSize: 18, fontWeight: "bold" }}>LogisticMap</div>
                <div>Загрузка данных...</div>
            </div>
        );
    }

    return (
        <>
            <Header />

            <div className="container">
                <Sidebar />
                <Map />
                <Inspector />
            </div>
        </>
    );
}

export default App;
