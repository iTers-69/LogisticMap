import { createHub } from "../models/hubModel";
import { createVillage } from "../models/villageModel";

export function normalizeExcel(rows) {

    const hubsMap = new Map();
    const villages = [];

    const report = {
        totalRows: rows.length,
        duplicateVillageKato: 0,
        emptyVillageKato: 0,
        emptyHub: 0
    };

    const villageKatoSet = new Set();

    rows.forEach((row) => {

        const hubName = row["Родитель"]?.trim();

        const hubKato = String(row["КАТО Родителя"] ?? "").trim();

        const villageKato = String(row["КАТО"] ?? "").trim();

        const fullName = row["НП"]?.trim() ?? "";

        if (!hubName) {
            report.emptyHub++;
            return;
        }

        if (!villageKato) {
            report.emptyVillageKato++;
            return;
        }

        if (villageKatoSet.has(villageKato)) {
            report.duplicateVillageKato++;
            return;
        }

        villageKatoSet.add(villageKato);

        if (!hubsMap.has(hubKato)) {

            hubsMap.set(
            hubKato,
              createHub({
                kato: hubKato,
                name: hubName
              })
            );
        }

        const parts = fullName.split(",");

        const shortName = parts[parts.length - 1].trim();

        villages.push(

          createVillage({

            kato: villageKato,

            name: shortName,

            fullName,

            hubName,

            hubKato

          })
          
        );

    });

    return {

        hubs: [...hubsMap.values()],

        villages,

        report

    };

}