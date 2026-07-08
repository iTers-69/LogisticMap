
import hubCoordinates from "../data/hubCoordinates.js";
import villageCoordinates from "../data/villageCoordinates.json";
import { buildAllHubBranches } from "../services/branchBuilderService.js";

export default function buildBranches(hubs, villages) {
    return buildAllHubBranches(hubs, villages, hubCoordinates, villageCoordinates);
}
