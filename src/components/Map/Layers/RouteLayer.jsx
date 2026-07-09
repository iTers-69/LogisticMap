import { useEffect, useState, useMemo } from "react";
import { Polyline, CircleMarker, Popup, useMap } from "react-leaflet";

import useAppStore from "../../../store/appStore";

import hubCoordinates from "../../../data/hubCoordinates";

import { getRoadRouteDetails } from "../../../services/osrmService";
import { enrichBranch } from "../../../utils/branchUtils";
import { resolveVillageCoord } from "../../../services/coordinatesService";
import { buildBranchRoutePoints, pointsToLatLngArray } from "../../../utils/buildBranchRoutePoints";

function RouteLayer() {

    const {
        branches,
        selectedBranch,
        villages,
        villageCoordinateOverrides,
        setBranchRouteData,
        resetRouteAnimation,
        setRouteLoading
    } = useAppStore();

    const mergedCoords = useMemo(() => new Proxy({}, {
        get(_target, prop) {
            return resolveVillageCoord(prop, villageCoordinateOverrides);
        }
    }), [villageCoordinateOverrides]);
    const map = useMap();
    const [routeCoords, setRouteCoords] = useState([]);
    const [waypoints, setWaypoints] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function buildRoute() {
            resetRouteAnimation();
            setBranchRouteData(null);
            setRouteCoords([]);
            setWaypoints([]);

            if (!selectedBranch) return;

            const branch = branches.find(b => b.id === selectedBranch.id);
            if (!branch) return;

            const hub = hubCoordinates[branch.hubKato];
            if (!hub) return;

            const enriched = enrichBranch(branch, hub, villages, mergedCoords);

            const routePoints = buildBranchRoutePoints(
                branch,
                hub,
                villages,
                mergedCoords
            );

            if (!routePoints) {
                setRouteLoading(false);
                return;
            }

            const points = [{ ...routePoints[0], type: "exit" }];

            (enriched.villageIds ?? []).forEach((id, index) => {
                const coords = resolveVillageCoord(id, villageCoordinateOverrides);
                if (!coords) return;

                const village = villages.find(v => String(v.id) === String(id));
                const lastId = enriched.villageIds[enriched.villageIds.length - 1];
                const isEnd = String(id) === String(enriched.endPointKato)
                    || String(id) === String(lastId);

                points.push({
                    lat: coords.lat,
                    lng: coords.lng,
                    type: isEnd ? "end" : "stop",
                    name: village?.name ?? id,
                    order: index + 1
                });
            });

            if (points.length < 2) {
                setRouteLoading(false);
                return;
            }

            setWaypoints(points);
            setRouteLoading(true);

            const fallbackCoords = pointsToLatLngArray(routePoints);

            try {
                const roadData = await getRoadRouteDetails(routePoints);

                if (cancelled) return;

                if (roadData?.coordinates?.length > 1) {
                    const coords = roadData.coordinates.map(p => [p.lat, p.lng]);
                    setRouteCoords(coords);

                    setBranchRouteData({
                        coordinates: roadData.coordinates,
                        distance: roadData.distance,
                        duration: roadData.duration,
                        waypoints: points
                    });

                    map.fitBounds(coords, { padding: [60, 60] });
                } else {
                    setRouteCoords(fallbackCoords);
                    setBranchRouteData({
                        coordinates: points.map(p => ({ lat: p.lat, lng: p.lng })),
                        distance: 0,
                        duration: 0,
                        waypoints: points
                    });
                    map.fitBounds(fallbackCoords, { padding: [60, 60] });
                }
            } catch (err) {
                console.error("Ошибка построения маршрута:", err);
                if (!cancelled) {
                    setRouteCoords(fallbackCoords);
                    setBranchRouteData({
                        coordinates: points.map(p => ({ lat: p.lat, lng: p.lng })),
                        distance: 0,
                        duration: 0,
                        waypoints: points
                    });
                    map.fitBounds(fallbackCoords, { padding: [60, 60] });
                }
            } finally {
                if (!cancelled) setRouteLoading(false);
            }
        }

        buildRoute();

        return () => {
            cancelled = true;
        };
    }, [selectedBranch?.id, branches, villages, villageCoordinateOverrides, mergedCoords, map, setBranchRouteData, resetRouteAnimation, setRouteLoading]);

    if (!selectedBranch) return null;

    const branch = branches.find(b => b.id === selectedBranch.id);
    const routeColor = branch?.color ?? "#e53935";
    const displayBranch = branch && hubCoordinates[branch.hubKato]
        ? enrichBranch(branch, hubCoordinates[branch.hubKato], villages, mergedCoords)
        : branch;

    return (
        <>
            {routeCoords.length > 1 && (
                <>
                    <Polyline
                        positions={routeCoords}
                        pathOptions={{
                            color: routeColor,
                            weight: 6,
                            opacity: 0.85,
                            lineJoin: "round",
                            lineCap: "round"
                        }}
                    />
                    <Polyline
                        positions={routeCoords}
                        pathOptions={{
                            color: "#ffffff",
                            weight: 2,
                            opacity: 0.6,
                            dashArray: "8 12"
                        }}
                    />
                </>
            )}

            {waypoints.map((wp, index) => {
                if (wp.type === "exit") {
                    return (
                        <CircleMarker
                            key={`exit-${index}`}
                            center={[wp.lat, wp.lng]}
                            radius={10}
                            pathOptions={{
                                fillColor: "#ff9800",
                                color: "#fff",
                                weight: 2,
                                fillOpacity: 1
                            }}
                        >
                            <Popup>
                                <strong>🚪 Ветка {displayBranch?.exitIndex ?? ""}</strong>
                                <br />
                                Направление: {displayBranch?.exitBearing ?? "—"}°
                            </Popup>
                        </CircleMarker>
                    );
                }

                if (wp.type === "end") {
                    return (
                        <CircleMarker
                            key={`end-${index}`}
                            center={[wp.lat, wp.lng]}
                            radius={10}
                            pathOptions={{
                                fillColor: "#f44336",
                                color: "#fff",
                                weight: 2,
                                fillOpacity: 1
                            }}
                        >
                            <Popup>
                                <strong>🏁 Точка Б (конец маршрута)</strong>
                                <br />
                                {wp.name}
                            </Popup>
                        </CircleMarker>
                    );
                }

                return null;
            })}
        </>
    );
}

export default RouteLayer;
