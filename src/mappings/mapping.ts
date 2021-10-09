import { ZERO_BI } from "./helpers"
import {
  GameCreated,
} from "../../generated/CoinLeaguesFactory/CoinLeaguesFactory"
import { Game } from "../../generated/schema"
import { CoinLeagues as CoinLeaguesContract } from "../../generated/templates/CoinLeagues/CoinLeagues"

export function handleGameCreated(event: GameCreated): void {
  let game = Game.load(event.params.gameAddress.toHexString());
  let leaguesContract = CoinLeaguesContract.bind(event.address);
  if(!game){
    game = new Game(event.params.gameAddress.toHexString());
    game.status = "Waiting";
    game.numPlayers = leaguesContract.game().value6;
    game.coins = leaguesContract.game().value5;
    game.entry = leaguesContract.game().value10;
    game.currentPlayers = ZERO_BI;
    game.players = [];
  }
  game.save();
}
