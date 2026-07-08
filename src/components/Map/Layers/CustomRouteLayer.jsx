import { useEffect } from "react";
import { CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import useAppStore from "../../../store/appStore";
import { getRoadRouteDetails } from "../../../services/osrmService";

function CustomRouteLayer() {
    const {
        customRouteStart,
        customRouteEnd,
        customRouteData,
        setCustomRouteData
    } = useAppStore();

    const map = useMap();

    useEffect(() => {
        let isCurrent = true;

        async function fetchRoute() {
            if (!customRouteStart || !customRouteEnd) {
                setCustomRouteData(null);
                return;
            }

            const points = [
                { lat: customRouteStart.lat, lng: customRouteStart.lng },
                { lat: customRouteEnd.lat, lng: customRouteEnd.lng }
            ];

            try {
                const data = await getRoadRouteDetails(points);
                if (data && isCurrent) {
                    setCustomRouteData(data);

                    // Fit map bounds to show the entire route
                    if (data.coordinates.length > 0) {
                        const bounds = data.coordinates.map(p => [p.lat, p.lng]);
                        map.fitBounds(bounds, { padding: [50, 50] });
                    }
                }
            } catch (err) {
                console.error("Ошибка при построении маршрута:", err);
            }
        }

        fetchRoute();

        return () => {
            isCurrent = false;
        };
    }, [customRouteStart, customRouteEnd, setCustomRouteData, map]);

    if (!customRouteStart && !customRouteEnd) return null;

    return (
        <>
            {customRouteStart && (
                <CircleMarker
                    center={[customRouteStart.lat, customRouteStart.lng]}
                    radius={8}
                    pathOptions={{
                        fillColor: "#4caf50",
                        color: "#fff",
                        weight: 2,
                        fillOpacity: 1
                    }}
                >
                    <Popup>
                        <strong>Пункт А (Старт):</strong>
                        <br />
                        {customRouteStart.name}
                    </Popup>
                </CircleMarker>
            )}

            {customRouteEnd && (
                <CircleMarker
                    center={[customRouteEnd.lat, customRouteEnd.lng]}
                    radius={8}
                    pathOptions={{
                        fillColor: "#f44336",
                        color: "#fff",
                        weight: 2,
                        fillOpacity: 1
                    }}
                >
                    <Popup>
                        <strong>Пункт Б (Финиш):</strong>
                        <br />
                        {customRouteEnd.name}
                    </Popup>
                </CircleMarker>
            )}

            {customRouteData && customRouteData.coordinates && (
                <Polyline
                    positions={customRouteData.coordinates.map(p => [p.lat, p.lng])}
                    pathOptions={{
                        color: "#2196f3",
                        weight: 6,
                        opacity: 0.8
                    }}
                />
            )}
        </>
    );
}

export default CustomRouteLayer;
