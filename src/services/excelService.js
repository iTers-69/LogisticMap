import * as XLSX from "xlsx";

export function readExcel(file) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = (event) => {

            const data = event.target.result;

            const workbook = XLSX.read(data, {
                type: "array"
            });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const rows = XLSX.utils.sheet_to_json(sheet);

            resolve(rows);
        };

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);

    });
}