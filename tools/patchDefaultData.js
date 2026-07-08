import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    applyHubAssignments,
    cleanupBranchesAfterHubChanges
} from "../src/services/hubAssignmentService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.join(__dirname, "..", "src", "data", "defaultAppData.json");

const data = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
const { villages, fixedCount } = applyHubAssignments(data.villages, data.hubs);

if (fixedCount > 0) {
    data.villages = villages;
    data.branches = cleanupBranchesAfterHubChanges(data.branches, villages);
    fs.writeFileSync(defaultPath, JSON.stringify(data));
    console.log("defaultAppData.json: исправлено", fixedCount, "сёл");
} else {
    console.log("defaultAppData.json: изменений не требуется");
}
