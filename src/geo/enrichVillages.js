import { getCoordinatesByKato } from "./coordinatesRepository";

export function enrichVillages(villages) {

    return villages.map(village => {

        const coords = getCoordinatesByKato(village.kato);

        if (!coords) return village;

        return {
            ...village,
            lat: coords.lat,
            lng: coords.lng
        };

    });

}