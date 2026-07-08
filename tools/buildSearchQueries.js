export default function buildSearchQueries(village) {

    const parts = village.fullName
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const region = parts[0] || "";
    const district = parts[1] || "";
    const city = parts[parts.length - 1] || "";

    const cleanCity = city
        .replace(/^г\./i, "")
        .replace(/^с\./i, "")
        .replace(/^п\./i, "")
        .trim();

    return [

        `${cleanCity}, ${district}, ${region}, Казахстан`,

        `${city}, ${district}, ${region}, Казахстан`,

        `${cleanCity}, ${region}, Казахстан`,

        `${city}, ${region}, Казахстан`,

        `${cleanCity}, Казахстан`

    ];

}