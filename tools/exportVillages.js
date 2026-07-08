import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { readExcel } from "../src/services/excelService.js";
import { normalizeExcel } from "../src/services/normalizeExcel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, "data", "Родитель.xlsx");

async function main() {

    const rows = await readExcel(excelPath);

    const data = normalizeExcel(rows);

    fs.writeFileSync(
        path.join(__dirname, "data", "villages.json"),
        JSON.stringify(data.villages, null, 2)
    );

    console.log("Экспортировано:", data.villages.length);

}

main();