import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    applyHubAssignments,
    getHubAssignmentIssues
} from "../src/services/hubAssignmentService.js";
import { createHub } from "../src/models/hubModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const villagesPath = path.join(__dirname, "data", "villages.json");
const villages = JSON.parse(fs.readFileSync(villagesPath, "utf8"));

const hubsMap = new Map();
villages.forEach((v) => {
    if (!hubsMap.has(v.hubKato)) {
        hubsMap.set(v.hubKato, createHub({ kato: v.hubKato, name: v.hubName }));
    }
});
const hubs = [...hubsMap.values()];

const issues = getHubAssignmentIssues(villages, hubs);
console.log("Найдено несоответствий:", issues.length);
issues.forEach((i) => console.log(`  ${i.name}: ${i.fromHub} → ${i.toHub} (${i.region})`));

const { villages: fixed, fixedCount } = applyHubAssignments(villages, hubs);
fs.writeFileSync(villagesPath, JSON.stringify(fixed, null, 2));
console.log("\nИсправлено:", fixedCount);
