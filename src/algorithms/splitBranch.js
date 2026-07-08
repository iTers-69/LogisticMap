export default function splitBranch(villages, maxStops = 30) {

    const branches = [];

    for (let i = 0; i < villages.length; i += maxStops) {

        branches.push(

            villages.slice(i, i + maxStops)

        );

    }

    return branches;

}