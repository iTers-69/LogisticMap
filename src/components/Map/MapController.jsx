import { useEffect } from "react";
import { useMap } from "react-leaflet";

import useAppStore from "../../store/appStore";
import hubCoordinates from "../../data/hubCoordinates";

function MapController() {

    const map = useMap();

    const { selectedHub } = useAppStore();

    useEffect(() => {

        if (!selectedHub) return;

        const coords = hubCoordinates[selectedHub.kato];

        if (!coords) return;

        map.flyTo(
            [coords.lat, coords.lng],
            coords.zoom,
            {
                animate: true,
                duration: 1.5
            }
        );

    }, [selectedHub, map]);

    return null;
}

export default MapController;