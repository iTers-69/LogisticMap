import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCoordinateIssues } from "../src/services/coordinateValidationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const villages = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "villages.json"), "utf8")
);
const coordinates = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "src", "data", "villageCoordinates.json"), "utf8")
);

const issues = getCoordinateIssues(villages, {}, coordinates);

const byType = {};
const bySeverity = {};
issues.forEach(i => {
    byType[i.type] = (byType[i.type] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
});

console.log("Всего сёл:", villages.length);
console.log("Проблем с координатами:", issues.length);
console.log("По типам:", byType);
console.log("По серьёзности:", bySeverity);

const outPath = path.join(__dirname, "data", "coordinateIssues.json");
fs.writeFileSync(outPath, JSON.stringify(issues, null, 2));
console.log("Сохранено:", outPath);

issues.forEach(i => {
    console.log(`  [${i.severity}] ${i.name} (${i.hubName}) — ${i.message}`);
});
