import useAppStore from "../../store/appStore";

import HubPanel from "./HubPanel";
import RoutePanel from "./RoutePanel";
import VillagePanel from "./VillagePanel";
import LogisticPanel from "./LogisticPanel";
import ImportPanel from "./ImportPanel";

function Sidebar() {
    const { activeTab } = useAppStore();

    return (
        <aside className="sidebar">
            {activeTab === "hubs" && <HubPanel />}
            {activeTab === "routes" && <RoutePanel />}
            {activeTab === "villages" && <VillagePanel />}
            {activeTab === "logistics" && <LogisticPanel />}
            {activeTab === "import" && <ImportPanel />}
        </aside>
    );
}

export default Sidebar;
