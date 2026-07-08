import fs from "fs";
import normalizeVillageName from "../src/utils/normalizeVillageName.js";

export default function parseOSM(filePath) {

    const geojson = JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );

    const places = new Map();

    for (const feature of geojson.features) {

        if (!feature.properties?.name) continue;
        if (!feature.geometry?.coordinates) continue;

        const [lng, lat] = feature.geometry.coordinates;

        const place = {
          name: feature.properties.name,
          lat,
          lng,
          place: feature.properties.place
        };

        const names = [
            feature.properties.name,
            feature.properties["name:ru"],
            feature.properties["name:kk"],
            feature.properties.old_name
        ].filter(Boolean);

        for (const name of names) {

          const key = normalizeVillageName(name);

          if (!places.has(key)) {
          places.set(key, []);
        }

        places.get(key).push({
        ...place,
        region: feature.properties["addr:region"] || "",
        district: feature.properties["addr:district"] || ""
      });

     }
    }

    return places;
}