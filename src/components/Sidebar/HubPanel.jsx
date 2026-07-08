import useAppStore from "../../store/appStore";

function HubPanel() {

    const {
    hubs,
    villages,
    selectedHub,
    selectHub
    } = useAppStore();

    return (

        <div>

            <h3>Хабы</h3>

            {hubs.map(hub => {

                const count = villages.filter(
                    village => village.hubKato === hub.kato
                ).length;

                return (

                    <div
                        key={hub.id}
                        onClick={() => selectHub(hub)}
                        className={
                            selectedHub?.id === hub.id
                                ? "hub-item active"
                                : "hub-item"
                        }
                    >

                        <strong>{hub.name}</strong>

                        <div>

                            {count} населённых пунктов

                        </div>

                    </div>

                );

            })}

        </div>

    );

}

export default HubPanel;