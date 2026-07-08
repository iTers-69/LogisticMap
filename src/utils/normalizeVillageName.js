export default function normalizeVillageName(name) {

    if (!name) return "";

    return String(name)
        .toLowerCase()

        // убираем тип населённого пункта
        .replace(/^г\.\s*/i, "")
        .replace(/^г\s+/i, "")
        .replace(/^с\.\s*/i, "")
        .replace(/^с\s+/i, "")
        .replace(/^п\.\s*/i, "")
        .replace(/^п\s+/i, "")
        .replace(/^ст\.\s*/i, "")
        .replace(/^ст\s+/i, "")
        .replace(/^пос\.\s*/i, "")
        .replace(/^пос\s+/i, "")
        .replace(/^аул\s+/i, "")
        .replace(/^ауыл\s+/i, "")

        // русские
        .replaceAll("ё", "е")

        // казахские
        .replaceAll("ә", "а")
        .replaceAll("ғ", "г")
        .replaceAll("қ", "к")
        .replaceAll("ң", "н")
        .replaceAll("ө", "о")
        .replaceAll("ұ", "у")
        .replaceAll("ү", "у")
        .replaceAll("һ", "х")
        .replaceAll("і", "и")

        .replace(/['’"]/g, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}