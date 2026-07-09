import { useMemo } from "react";
import useAppStore from "../../store/appStore";

function HubPanel() {
    const {
        hubs,
        villages,
        selectedHub,
        selectHub
    } = useAppStore();

    const villageCountByHub = useMemo(() => {
        const counts = new Map();
        for (const village of villages ?? []) {
            if (!village.hubKato) continue;
            counts.set(village.hubKato, (counts.get(village.hubKato) ?? 0) + 1);
        }
        return counts;
    }, [villages]);

    const handleHubClick = (hub) => {
        if (selectedHub?.kato === hub.kato) {
            useAppStore.setState({
                selectedHub: null,
                selectedVillage: null
            });
            return;
        }
        selectHub(hub);
    };

    return (
        <div className="hub-panel">
            <h3 className="sidebar-panel__title">Хабы</h3>

            <div className="hub-panel__list">
                {(hubs ?? []).map(hub => {
                    const isExpanded = selectedHub?.kato === hub.kato;
                    const count = villageCountByHub.get(hub.kato) ?? 0;

                    return (
                        <div
                            key={hub.kato}
                            onClick={() => handleHubClick(hub)}
                            className={isExpanded ? "hub-item active" : "hub-item"}
                        >
                            <div className="hub-item__header">
                                <strong className="hub-item__name">{hub.name}</strong>
                                <span className={`hub-item__chevron${isExpanded ? " hub-item__chevron--open" : ""}`}>
                                    ›
                                </span>
                            </div>

                            {isExpanded && (
                                <div className="hub-item__details">
                                    {count} населённых пунктов
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default HubPanel;
