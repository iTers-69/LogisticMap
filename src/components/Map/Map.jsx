import HubLayer from "./Layers/HubLayers";
import VillageLayer from "./Layers/VillageLayer";
import MapController from "./MapController";
import RouteLayer from "./Layers/RouteLayer";
import CustomRouteLayer from "./Layers/CustomRouteLayer";
import CarAnimationLayer from "./Layers/CarAnimationLayer";
import CoordinateEditorLayer from "./Layers/CoordinateEditorLayer";

import { MapContainer, TileLayer } from "react-leaflet";

function Map() {

    return (

        <MapContainer
            center={[48.0196, 66.9237]}
            zoom={5}
            style={{ width: "100%", height: "100%" }}
        >

            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController />

            <HubLayer />

            <VillageLayer />

            <RouteLayer />

            <CarAnimationLayer />

            <CoordinateEditorLayer />

            <CustomRouteLayer />

        </MapContainer>

    );

}

export default Map;