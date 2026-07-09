import useAppStore from "../../store/appStore";

function SidebarTabs() {
    const { activeTab, setActiveTab } = useAppStore();

    const tabs = [
        { id: "hubs", title: "Хабы" },
        { id: "routes", title: "Маршруты" },
        { id: "villages", title: "НП" },
        { id: "logistics", title: "Логисты" },
        { id: "import", title: "Импорт" }
    ];

    return (
        <nav className="header-nav" aria-label="Разделы">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    type="button"
                    className={
                        activeTab === tab.id
                            ? "header-nav__btn header-nav__btn--active"
                            : "header-nav__btn"
                    }
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.title}
                </button>
            ))}
        </nav>
    );
}

export default SidebarTabs;
