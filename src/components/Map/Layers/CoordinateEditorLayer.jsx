import { useEffect, useState } from "react";
import { Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import useAppStore from "../../../store/appStore";
import { resolveVillageCoord } from "../../../services/coordinatesService";

const editIcon = L.divIcon({
    className: "coord-edit-marker",
    html: `<div style="
        font-size: 24px;
        line-height: 1;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        cursor: grab;
    ">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
});

function CoordinateEditorLayer() {
    const {
        selectedVillage,
        coordinateEditMode,
        villageCoordinateOverrides,
        setVillageCoordinate,
        setCoordinateEditMode
    } = useAppStore();

    const coords = selectedVillage
        ? resolveVillageCoord(selectedVillage.kato, villageCoordinateOverrides)
        : null;

    const [position, setPosition] = useState(null);

    useEffect(() => {
        if (coords) {
            setPosition([coords.lat, coords.lng]);
        } else {
            setPosition(null);
        }
    }, [coords?.lat, coords?.lng, selectedVillage?.kato]);

    useMapEvents({
        click(e) {
            if (!coordinateEditMode || !selectedVillage) return;
            const { lat, lng } = e.latlng;
            setVillageCoordinate(selectedVillage.kato, lat, lng);
            setPosition([lat, lng]);
        }
    });

    if (!coordinateEditMode || !selectedVillage) return null;

    if (!position) {
        return null;
    }

    return (
        <Marker
            position={position}
            icon={editIcon}
            draggable
            zIndexOffset={2000}
            eventHandlers={{
                dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    setVillageCoordinate(selectedVillage.kato, lat, lng);
                    setPosition([lat, lng]);
                }
            }}
        >
            <Popup>
                <strong>{selectedVillage.name}</strong>
                <br />
                <small>Перетащите или кликните на карте</small>
                <br />
                <button
                    onClick={() => setCoordinateEditMode(false)}
                    style={{
                        marginTop: 6,
                        padding: "4px 10px",
                        border: "none",
                        borderRadius: 4,
                        background: "#1976d2",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 12
                    }}
                >
                    Готово
                </button>
            </Popup>
        </Marker>
    );
}

export default CoordinateEditorLayer;
