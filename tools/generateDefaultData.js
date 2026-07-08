import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import buildBranches from "../src/algorithms/buildBranches.js";
import buildLogisticians from "../src/algorithms/buildLogisticians.js";
import { createHub } from "../src/models/hubModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const villages = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "villages.json"), "utf8")
);

const hubsMap = new Map();
villages.forEach((v) => {
    if (!hubsMap.has(v.hubKato)) {
        hubsMap.set(v.hubKato, createHub({ kato: v.hubKato, name: v.hubName }));
    }
});

const hubs = [...hubsMap.values()];
const branches = buildBranches(hubs, villages);
const logisticians = buildLogisticians(branches);

const data = {
    hubs,
    villages,
    branches,
    logisticians,
    villageCoordinateOverrides: {}
};

const outPath = path.join(__dirname, "..", "src", "data", "defaultAppData.json");
fs.writeFileSync(outPath, JSON.stringify(data));

console.log("defaultAppData.json создан");
console.log("  хабов:", hubs.length);
console.log("  сёл:", villages.length);
console.log("  веток:", branches.length);
console.log("  логистов:", logisticians.length);
console.log("  размер:", Math.round(fs.statSync(outPath).size / 1024), "KB");
