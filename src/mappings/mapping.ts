import { ZERO_BI, ONE_BI } from "./helpers"
import {
  GameCreated,
} from "../../generated/CoinLeaguesFactory/CoinLeaguesFactory"
import { Game } from "../../generated/schema"
import { CoinLeagues as CoinLeaguesContract } from "../../generated/templates/CoinLeagues/CoinLeagues"
import { CoinLeagues as CoinLeaguesTemplates } from "../../generated/templates"
import { Bytes, BigInt } from "@graphprotocol/graph-ts"
export function handleGameCreated(event: GameCreated): void {
  CoinLeaguesTemplates.create(event.params.gameAddress);
  let game = Game.load(event.params.gameAddress.toHexString());
  let leaguesContract = CoinLeaguesContract.bind(event.params.gameAddress);
  if(!game){
    game = new Game(event.params.gameAddress.toHexString());
    game.status = "Waiting";
    game.createdAt = event.block.timestamp;
    game.type = BigInt.fromI32(leaguesContract.game().value0).equals(ZERO_BI) ? 'Bull' : 'Bear';
    game.duration = leaguesContract.game().value7;
    game.numPlayers = leaguesContract.game().value6;
    game.numCoins = leaguesContract.game().value5;
    game.entry = leaguesContract.game().value10;
    game.currentPlayers = ZERO_BI;
    game.playerAddresses = new Array<Bytes>(0);
    game.save();
  }
 
}
