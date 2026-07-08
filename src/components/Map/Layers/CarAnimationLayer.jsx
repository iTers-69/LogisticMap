import { useEffect, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";

import useAppStore from "../../../store/appStore";
import {
    buildCumulativeDistances,
    interpolateAlongRoute,
    toDeg
} from "../../../utils/routeUtils";

const carIcon = L.divIcon({
    className: "car-marker",
    html: `<div class="car-marker-inner" style="
        font-size: 28px;
        line-height: 1;
        transform-origin: center center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
    ">🚛</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

function CarAnimationLayer() {
    const {
        branchRouteData,
        routeAnimation,
        setRouteAnimation,
        selectedBranch
    } = useAppStore();

    const [position, setPosition] = useState(null);
    const [rotation, setRotation] = useState(0);
    const markerRef = useRef(null);
    const rafRef = useRef(null);
    const lastTimeRef = useRef(null);
    const progressRef = useRef(0);

    useEffect(() => {
        progressRef.current = routeAnimation.progress;
    }, [routeAnimation.progress]);

    useEffect(() => {
        if (!routeAnimation.playing || !branchRouteData?.coordinates?.length) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = null;
            return;
        }

        progressRef.current = routeAnimation.progress;

        const coords = branchRouteData.coordinates;
        const cumDist = buildCumulativeDistances(coords);
        const totalDist = cumDist[cumDist.length - 1];
        const durationSec = branchRouteData.duration || Math.max(totalDist / 15 * 3.6, 10);
        const speed = routeAnimation.speed || 1;

        const animate = (timestamp) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const delta = (timestamp - lastTimeRef.current) / 1000;
            lastTimeRef.current = timestamp;

            const progressDelta = (delta * speed) / durationSec;
            progressRef.current = Math.min(1, progressRef.current + progressDelta);

            const dist = progressRef.current * totalDist;
            const point = interpolateAlongRoute(coords, cumDist, dist);

            if (point) {
                setPosition([point.lat, point.lng]);
                setRotation(toDeg(point.bearing));
            }

            setRouteAnimation({ progress: progressRef.current });

            if (progressRef.current < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setRouteAnimation({ playing: false });
            }
        };

        lastTimeRef.current = null;
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = null;
        };
    }, [routeAnimation.playing, routeAnimation.speed, branchRouteData, setRouteAnimation]);

    useEffect(() => {
        if (!branchRouteData?.coordinates?.length) {
            setPosition(null);
            return;
        }

        if (!routeAnimation.playing && routeAnimation.progress === 0) {
            const first = branchRouteData.coordinates[0];
            setPosition([first.lat, first.lng]);
            setRotation(0);
        }
    }, [branchRouteData, routeAnimation.playing, routeAnimation.progress]);

    useEffect(() => {
        const el = markerRef.current?.getElement();
        if (!el) return;
        const inner = el.querySelector(".car-marker-inner");
        if (inner) {
            inner.style.transform = `rotate(${rotation - 90}deg)`;
        }
    }, [rotation, position]);

    if (!selectedBranch || !branchRouteData?.coordinates?.length || !position) {
        return null;
    }

    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={carIcon}
            zIndexOffset={1000}
        />
    );
}

export default CarAnimationLayer;
