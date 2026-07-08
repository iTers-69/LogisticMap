import fs from "fs/promises";

import buildSearchQueries from "./buildSearchQueries.js";
import getDistance from "./geoDistance.js";

import hubCoordinates from "../src/data/hubCoordinates.js";

const villages = JSON.parse(
    await fs.readFile("./tools/data/villages.json", "utf8")
);

let coordinates = {};

try {
    coordinates = JSON.parse(
        await fs.readFile("./src/data/villageCoordinates.json", "utf8")
    );
} catch {
    coordinates = {};
}

const notFound = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

for (let i = 0; i < villages.length; i++) {

    const village = villages[i];

    if (coordinates[village.kato]) {
        continue;
    }

    console.log(`\n[${i + 1}/${villages.length}] ${village.name}`);

    const hub = hubCoordinates[village.hubKato];

    if (!hub) {
        console.log("Хаб не найден");
        notFound.push(village);
        continue;
    }

    let bestPlace = null;
    let bestDistance = Infinity;

    const queries = buildSearchQueries(village);

    for (const search of queries) {

        console.log("   →", search);

        try {

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&limit=5`,
                {
                    headers: {
                        "User-Agent": "LogisticMap/1.0"
                    }
                }
            );

            const results = await response.json();

            for (const place of results) {

                const distance = getDistance(
                    hub.lat,
                    hub.lng,
                    Number(place.lat),
                    Number(place.lon)
                );

                if (distance < bestDistance) {

                    bestDistance = distance;
                    bestPlace = place;

                }

            }

        } catch (err) {

            console.log(err.message);

        }

        await sleep(2000);

        if (bestDistance < 200)
            break;

    }

    if (bestPlace) {

        coordinates[village.kato] = {

            lat: Number(bestPlace.lat),

            lng: Number(bestPlace.lon)

        };

        console.log(
            `✓ ${Math.round(bestDistance)} км`
        );

    } else {

        console.log("✗ не найдено");

        notFound.push(village);

    }

    await fs.writeFile(
        "./src/data/villageCoordinates.json",
        JSON.stringify(coordinates, null, 2)
    );

}

await fs.writeFile(
    "./tools/data/notFound.json",
    JSON.stringify(notFound, null, 2)
);

console.log("\n================================");
console.log("Готово");
console.log("Найдено:", Object.keys(coordinates).length);
console.log("Не найдено:", notFound.length);