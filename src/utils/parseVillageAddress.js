export default function parseVillageAddress(fullName) {

    const parts = fullName
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    return {

        region: parts[0] ?? "",

        district: parts[1] ?? "",

        locality: parts.at(-1) ?? ""

    };

}