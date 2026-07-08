import coordinates from "../data/kazakhstanCoordinates.json";

export function getCoordinatesByKato(kato) {

    return coordinates[String(kato)] ?? null;

}

export function hasCoordinates(kato) {

    return Boolean(coordinates[String(kato)]);

}