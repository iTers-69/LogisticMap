import { createLogistician } from "../models/logisticianModel";

export default function buildLogisticians(branches) {

    const names = [

        "Татьяна",

        "Акмарал",

        "Канат",

        "Эльмира"

    ];

    const logisticians = names.map((name, index) =>

        createLogistician({

            id: index + 1,

            name

        })

    );

    branches.forEach((branch, index) => {

        const logistician =
            logisticians[index % logisticians.length];

        logistician.branchIds.push(branch.id);

        logistician.totalVillages += branch.totalStops;

        branch.logisticianId = logistician.id;

    });

    return logisticians;

}