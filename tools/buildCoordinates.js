import parseVillageAddress from "../src/utils/parseVillageAddress.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hubCoordinates from "../src/data/hubCoordinates.js";
import getDistance from "./geoDistance.js"

import parseOSM from "./parseOSM.js";
import normalizeVillageName from "../src/utils/normalizeVillageName.js";


const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const geoPath = path.join(__dirname, "data", "kazakhstan.geojson");
const villagesPath = path.join(__dirname, "data", "villages.json");

const outputPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "villageCoordinates.json"
);

const places = parseOSM(geoPath);

const villages = JSON.parse(
    fs.readFileSync(villagesPath, "utf8")
);

const coordinates = {};
const notFound = [];

for (const village of villages) {

    const key = normalizeVillageName(village.name);

    const candidates = places.get(key);

    if (!candidates || candidates.length === 0) {

        notFound.push({
            kato: village.kato,
            name: village.name
        });

        continue;
    }

    const address = parseVillageAddress(village.fullName);

    const region = normalizeVillageName(address.region);
    const district = normalizeVillageName(address.district);

    let best = candidates.find(candidate => {

        const candidateRegion = normalizeVillageName(candidate.region || "");
        const candidateDistrict = normalizeVillageName(candidate.district || "");

        return (
            candidateRegion.includes(region) ||
            candidateDistrict.includes(district)
        );

    });

    if (!best) {
        best = candidates[0];
    }

    coordinates[village.kato] = {
        lat: best.lat,
        lng: best.lng
    };

}

fs.writeFileSync(
    outputPath,
    JSON.stringify(coordinates, null, 2)
);

console.log("================================");
console.log("Всего населённых пунктов :", villages.length);
console.log("Найдено                 :", Object.keys(coordinates).length);
console.log("Не найдено              :", notFound.length);
console.log("================================");

if (notFound.length) {

    fs.writeFileSync(
        path.join(__dirname, "data", "notFound.json"),
        JSON.stringify(notFound, null, 2)
    );

    console.log("Создан tools/data/notFound.json");
}