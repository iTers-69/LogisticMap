import { useEffect } from "react";
import { useMap } from "react-leaflet";

import useAppStore from "../../store/appStore";
import hubCoordinates from "../../data/hubCoordinates";
import { resolveVillageCoord } from "../../services/coordinatesService";

function MapController() {

    const map = useMap();

    const {
        selectedHub,
        selectedBranch,
        selectedRouteStopId,
        villages,
        villageCoordinateOverrides
    } = useAppStore();

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

    useEffect(() => {
        if (!selectedRouteStopId || !selectedBranch) return;

        const village = villages.find(v => v.id === selectedRouteStopId);
        if (!village) return;

        const coords = resolveVillageCoord(village.kato, villageCoordinateOverrides);
        if (!coords) return;

        map.flyTo([coords.lat, coords.lng], 12, {
            animate: true,
            duration: 1.2
        });
    }, [selectedRouteStopId, selectedBranch, villages, villageCoordinateOverrides, map]);

    return null;
}

export default MapController;