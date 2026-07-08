import useAppStore from "../../store/appStore";

function SidebarTabs() {

    const { activeTab, setActiveTab } = useAppStore();

    const tabs = [
        { id: "hubs", title: "📍 Хабы" },
        { id: "routes", title: "🚚 Маршруты" },
        { id: "villages", title: "🏘️ Сёла" },
        { id: "logistics", title: "👤 Логисты" },
        { id: "import", title: "📥 Импорт" }
    ];

    return (

        <div className="sidebar-tabs">

            {tabs.map(tab => (

                <button
                    key={tab.id}
                    className={
                        activeTab === tab.id
                            ? "tab-button active"
                            : "tab-button"
                    }
                    onClick={() => setActiveTab(tab.id)}
                >

                    {tab.title}

                </button>

            ))}

        </div>

    );

}

export default SidebarTabs;