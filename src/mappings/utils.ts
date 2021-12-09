
import { BigInt } from "@graphprotocol/graph-ts";
import { Player } from "../../generated/schema";
import { ONE_BI, ZERO_BI } from "./helpers";

/**
 * Creates a player if not exists
 * @param address 
 * @param entry 
 */
export const createPlayer = (address: string, entry: BigInt): Player => {
    const player = new Player(address);
    player.totalEarned = ZERO_BI;
    player.totalJoinedGames = ONE_BI;
    player.totalFirstWinnedGames = ZERO_BI;
    player.totalSecondWinnedGames = ZERO_BI;
    player.totalThirdWinnedGames = ZERO_BI;
    player.totalWinnedGames = ZERO_BI;
    player.totalEarned = ZERO_BI;
    player.totalSpent = entry;
    player.EarnedMinusSpent = ZERO_BI;
    player.estimatedAffiliateEarnings = ZERO_BI;
    player.save();
    return player;
}