import { ZERO_BI } from "./helpers";
import { GameCreated } from "../../generated/CoinLeaguesFactory/CoinLeaguesFactory";
import { Affiliate, Game, Player } from "../../generated/schema";
import { CoinLeagues as CoinLeaguesContract } from "../../generated/templates/CoinLeagues/CoinLeagues";
import { CoinLeagues as CoinLeaguesTemplates } from "../../generated/templates";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { createPlayer } from "./utils";
export function handleGameCreated(event: GameCreated): void {
  CoinLeaguesTemplates.create(event.params.gameAddress);
  let game = Game.load(event.params.gameAddress.toHexString());

  let leaguesContract = CoinLeaguesContract.bind(event.params.gameAddress);
  if (!game) {
    game = new Game(event.params.gameAddress.toHexString());
    game.status = "Waiting";
    game.createdAt = event.block.timestamp;
    game.createdBy = event.transaction.from;
    game.entry = leaguesContract.game().value10;

    let player = Player.load(event.transaction.from.toHexString());
    if (player === null) {
      const pl = createPlayer(
        event.transaction.from.toHexString(),
        game.entry
      ) as Player;
      const affiliate = new Affiliate(`${game.id}-creator-${pl.id}`);
      affiliate.affiliate = event.transaction.from;
      affiliate.game = game.id;
      affiliate.type = "Creator";
      affiliate.status = "Waiting";
      affiliate.player = pl.id;
      affiliate.createdAt =  event.block.timestamp;
      affiliate.save();
      game.affiliateIds = [affiliate.id];
    } else {
      const affiliate = new Affiliate(`${game.id}-creator-${player.id}`);
      affiliate.affiliate = event.transaction.from;
      affiliate.game = game.id;
      affiliate.type = "Creator";
      affiliate.status = "Waiting";
      affiliate.player = player.id;
      affiliate.createdAt =  event.block.timestamp;
      affiliate.save();
      game.affiliateIds = [affiliate.id];
    }

    game.startsAt = leaguesContract.game().value8;
    game.type = BigInt.fromI32(leaguesContract.game().value0).equals(ZERO_BI)
      ? "Bull"
      : "Bear";
    game.duration = leaguesContract.game().value7;
    game.numPlayers = leaguesContract.game().value6;
    game.numCoins = leaguesContract.game().value5;

    game.currentPlayers = ZERO_BI;
    game.playerAddresses = new Array<Bytes>(0);
    game.intId = event.params.id;
    game.save();
  }
}
