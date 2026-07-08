import { Marker, Popup } from "react-leaflet";

import useAppStore from "../../../store/appStore";
import hubCoordinates from "../../../data/hubCoordinates";

function HubLayer() {

    const { hubs } = useAppStore();

    return (

        <>

            {hubs.map((hub) => {

                const coords = hubCoordinates[hub.kato];

                if (!coords) return null;

                return (

                    <Marker
                        key={hub.id}
                        position={[coords.lat, coords.lng]}
                    >

                        <Popup>

                            <strong>{hub.name}</strong>

                            <br />

                            КАТО: {hub.kato}

                        </Popup>

                    </Marker>

                );

            })}

        </>

    );

}

export default HubLayer;