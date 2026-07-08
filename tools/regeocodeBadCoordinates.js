import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    getCoordinateIssues
} from "../src/services/coordinateValidationService.js";
import { geocodeVillage } from "../src/services/geocodeService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const villagesPath = path.join(__dirname, "data", "villages.json");
const coordinatesPath = path.join(__dirname, "..", "src", "data", "villageCoordinates.json");

const villages = JSON.parse(fs.readFileSync(villagesPath, "utf8"));
const coordinates = JSON.parse(fs.readFileSync(coordinatesPath, "utf8"));

const issues = getCoordinateIssues(villages, {}, coordinates);
const toFix = issues.filter(i =>
    i.type === "duplicate"
    || i.type === "missing"
    || i.type === "outside_kz"
    || i.severity === "critical"
    || (i.type === "far_from_region" && i.severity === "warning")
);

console.log("Сёл с проблемными координатами:", toFix.length);

const failed = [];
let fixed = 0;

for (let i = 0; i < toFix.length; i++) {
    const issue = toFix[i];
    const village = villages.find(v => String(v.kato) === String(issue.kato));

    if (!village) continue;

    console.log(`\n[${i + 1}/${toFix.length}] ${village.name} — ${issue.message}`);

    const result = await geocodeVillage(village, { delayMs: 2000, maxDistanceKm: 400 });

    if (result.ok) {
        coordinates[village.kato] = { lat: result.lat, lng: result.lng };
        fs.writeFileSync(coordinatesPath, JSON.stringify(coordinates, null, 2));
        console.log(`✓ ${result.distanceKm} км — ${result.displayName?.slice(0, 80)}`);
        fixed++;
    } else {
        console.log(`✗ ${result.error}`);
        failed.push({ kato: village.kato, name: village.name, error: result.error });
    }
}

const remaining = getCoordinateIssues(villages, {}, coordinates);

console.log("\n================================");
console.log("Исправлено:", fixed);
console.log("Не удалось:", failed.length);
console.log("Осталось проблем:", remaining.length);

if (failed.length) {
    fs.writeFileSync(
        path.join(__dirname, "data", "regeocodeFailed.json"),
        JSON.stringify(failed, null, 2)
    );
}
