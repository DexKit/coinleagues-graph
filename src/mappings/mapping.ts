import { IS_BITBOY_TEAM, ONE_BI, SECOND_BI, ZERO_BI } from "./helpers";

import { Affiliate, Earning, Game, HouseClaim, Player, PlayerGame, Withdrawal } from "../../generated/schema";

import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts";
import { createPlayer } from "./utils";
import { AbortedGame, Claimed, EndedGame, GameCreated, HouseClaimed, JoinedGame, StartedGame, Winned, WinnedMultiple, Withdrawed } from "../../generated/CoinLeagueFactoryV3/CoinLeagueFactoryV3";
import { CoinLeagueFactoryV3 as CoinLeagueContract } from "../../generated/CoinLeagueFactoryV3/CoinLeagueFactoryV3";
export function handleGameCreated(event: GameCreated): void {

  let game = Game.load(event.params.id.toString());
  let gameId = event.params.id;

  let leagueContract = CoinLeagueContract.bind(event.address);

  if (!game) {
    game = new Game(event.params.id.toString());
    game.status = "Waiting";
    game.createdAt = event.block.timestamp;
    game.createdBy = event.transaction.from;
    game.entry = leagueContract.games(gameId).value11;

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
      affiliate.createdAt = event.block.timestamp;
      affiliate.save();
      game.affiliateIds = [affiliate.id];
    } else {
      const affiliate = new Affiliate(`${game.id}-creator-${player.id}`);
      affiliate.affiliate = event.transaction.from;
      affiliate.game = game.id;
      affiliate.type = "Creator";
      affiliate.status = "Waiting";
      affiliate.player = player.id;
      affiliate.createdAt = event.block.timestamp;
      affiliate.save();
      game.affiliateIds = [affiliate.id];
    }

    game.startsAt = leagueContract.games(gameId).value9;
    game.type = BigInt.fromI32(leagueContract.games(gameId).value1).equals(ZERO_BI)
      ? "Bull"
      : "Bear";
    game.duration = leagueContract.games(gameId).value8;
    game.numPlayers = leagueContract.games(gameId).value7;
    game.numCoins = leagueContract.games(gameId).value6;
    game.coinToPlay = leagueContract.games(gameId).value13;

    game.currentPlayers = ZERO_BI;
    game.playerAddresses = new Array<Bytes>(0);
    game.intId = event.params.id;
    game.save();
  }
}

export function handleJoinedGame(event: JoinedGame): void {
  let game = Game.load(event.params.id.toString()) as Game;
  let player = Player.load(event.params.playerAddress.toHexString());

  if (player === null) {
    player = createPlayer(event.params.playerAddress.toHexString(), game.entry);
  } else {
    if (player.totalJoinedGames) {
      player.totalJoinedGames = player.totalJoinedGames.plus(ONE_BI);
    }
    player.totalSpent = player.totalSpent.plus(game.entry);
    player.save();
  }

  if (game.currentPlayers) {
    game.currentPlayers = game.currentPlayers.plus(ONE_BI);
  }

  if (player && game) {
    const playerGame = new PlayerGame(`${game.id}-${player.id}`);
    playerGame.game = game.id;
    playerGame.player = player.id;
    playerGame.save();
    if (event.params.affiliate.toString() !== Address.zero().toString()) {
      const affiliate = new Affiliate(
        `${game.id}-${player.id}-${event.params.affiliate.toHexString()}`
      );
      affiliate.affiliate = event.params.affiliate;
      affiliate.game = game.id;
      affiliate.type = "Joined";
      affiliate.player = player.id;
      affiliate.status = "Waiting";
      affiliate.createdAt = event.block.timestamp;
      affiliate.save();
      let affIds = game.affiliateIds;
      if (affIds && affIds.length) {
        affIds.push(affiliate.id);
      } else {
        affIds = [affiliate.id];
      }
      game.affiliateIds = affIds;
    }
  }
  const playerAddress = event.params.playerAddress;
  const playerAddresses = game.playerAddresses;
  playerAddresses.push(playerAddress);
  game.playerAddresses = playerAddresses;
  if (IS_BITBOY_TEAM(playerAddress.toHexString())) {
    game.isBitboyTeam = true;
  } else {
    game.isBitboyTeam = false;
  }

  game.save();
}

export function handleStartedGame(event: StartedGame): void {
  let game = Game.load(event.params.id.toString()) as Game;
  game.status = "Started";
  game.startedAt = event.params.timestamp;
  game.save();
}

export function handleEndedGame(event: EndedGame): void {
  let game = Game.load(event.params.id.toString()) as Game;
  game.endedAt = event.params.timestamp;
  game.status = "Ended";
  const affiliates = game.affiliateIds;
  if (affiliates && affiliates.length) {
    for (let index = 0; index < affiliates.length; index++) {
      const aff = Affiliate.load(affiliates[index]) as Affiliate;
      aff.status = "Finished";
      aff.save();
      let player = Player.load(aff.player);
      if (player === null) {
        const pl = createPlayer(aff.player, game.entry);
        pl.estimatedAffiliateEarnings = pl.estimatedAffiliateEarnings.plus(
          game.entry
            .times(BigInt.fromString("5"))
            .div(BigInt.fromString("1000"))
        );
        pl.save();
      } else {
        if (aff.type === "Creator") {
          // Calculate here the estimated affiliates, 5% for the creator
          player.estimatedAffiliateEarnings = player.estimatedAffiliateEarnings.plus(
            game.entry
              .times(BigInt.fromString("5"))
              .div(BigInt.fromString("1000"))
          );
        } else {
          // Calculate here the estimated affiliates, 5% for all total joins
          player.estimatedAffiliateEarnings = player.estimatedAffiliateEarnings.plus(
            game.entry
              .times(BigInt.fromString("5"))
              .div(BigInt.fromString("1000"))
              .div(game.currentPlayers)
          );
        }
        player.save();
      }
    }
  }
  let claim = new HouseClaim(game.id);
  claim.amount = game.currentPlayers
    .times(game.entry)
    .times(BigInt.fromI32(10))
    .div(BigInt.fromI32(100));
  claim.claimed = false;
  claim.game = game.id;
  claim.save();

  game.save();
}

export function handleAbortedGame(event: AbortedGame): void {
  let game = Game.load(event.params.id.toString()) as Game;
  game.abortedAt = event.params.timestamp;
  game.status = "Aborted";
  const affiliates = game.affiliateIds;

  if (affiliates && affiliates.length) {
    for (let index = 0; index < affiliates.length; index++) {
      const aff = Affiliate.load(affiliates[index]) as Affiliate;
      aff.status = "Failed";
      aff.save();
    }
  }

  game.save();
}

export function handleHouseClaims(event: HouseClaimed): void {
  //let house = House.load("house") as House;
  let game = Game.load(event.params.id.toString()) as Game;
  if (game) {
    /* if (house === null) {
       house = new House("house");
       house.totalClaims = ONE_BI;
       house.totalClaimed = game.currentPlayers
         .times(game.entry)
         .times(BigInt.fromI32(10))
         .div(BigInt.fromI32(100));
       house.save();
     } else {
       house.totalClaims = house.totalClaims.plus(ONE_BI) as BigInt;
       house.totalClaimed = house.totalClaimed.plus(
         game.currentPlayers
           .times(game.entry)
           .times(BigInt.fromI32(10))
           .div(BigInt.fromI32(100))
       ) as BigInt;
       house.save();
     }*/

    let claim = HouseClaim.load(game.id) as HouseClaim;
    if (claim) {
      claim.at = event.block.timestamp;
      claim.claimed = true;
      claim.save();
    } else {
      let claim = new HouseClaim(game.id);
      claim.amount = game.currentPlayers
        .times(game.entry)
        .times(BigInt.fromI32(10))
        .div(BigInt.fromI32(100));
      claim.at = event.block.timestamp;
      claim.claimed = true;
      claim.save();
    }

  }

}

export function handleWithdrawed(event: Withdrawed): void {
  let game = Game.load(event.params.id.toString()) as Game;
  let player = Player.load(event.params.playerAddress.toHexString()) as Player;
  let withdraw = new Withdrawal(`${game.id}-${player.id}`);
  player.totalSpent = player.totalSpent.minus(game.entry);
  withdraw.game = game.id;
  withdraw.player = player.id;
  withdraw.at = event.params.timestamp;
  withdraw.save();
}

export function handleWinned(event: Winned): void {
  let game = Game.load(event.params.id.toString()) as Game;
  let player = Player.load(event.params.first.toHexString()) as Player;
  let earning = new Earning(`${game.id}-${player.id}`);
  earning.game = game.id;
  earning.player = player.id;
  earning.place = ZERO_BI;
  earning.amount = ZERO_BI;
  earning.save();
}

export function handleWinnedMultiple(event: WinnedMultiple): void {
  let game = Game.load(event.params.id.toString()) as Game;
  let playerZero = Player.load(event.params.first.toHexString()) as Player;
  let playerOne = Player.load(event.params.second.toHexString()) as Player;
  let playerSecond = Player.load(event.params.third.toHexString()) as Player;
  let earning = new Earning(`${game.id}-${playerZero.id}`);
  earning.game = game.id;
  earning.player = playerZero.id;
  earning.place = ZERO_BI;
  earning.amount = ZERO_BI;
  earning.claimed = false;
  earning.save();

  earning = new Earning(`${game.id}-${playerOne.id}`);
  earning.game = game.id;
  earning.player = playerOne.id;
  earning.place = ONE_BI;
  earning.amount = ZERO_BI;
  earning.claimed = false;
  earning.save();

  earning = new Earning(`${game.id}-${playerSecond.id}`);
  earning.game = game.id;
  earning.player = playerSecond.id;
  earning.place = SECOND_BI;
  earning.amount = ZERO_BI;
  earning.claimed = false;
  earning.save();
}

export function handleClaimed(event: Claimed): void {
  let player = Player.load(event.params.playerAddress.toHexString()) as Player;
  // let leaguesContract = CoinLeaguesContract.bind(event.address);
  let game = Game.load(event.params.id.toString()) as Game;
  if (player && game) {
    if (event.params.place.equals(ZERO_BI)) {
      if (player.totalWinnedGames) {
        player.totalWinnedGames = player.totalWinnedGames.plus(ONE_BI);
      }
      if (player.totalFirstWinnedGames) {
        player.totalFirstWinnedGames = player.totalFirstWinnedGames.plus(
          ONE_BI
        );
      }
    }

    if (event.params.place.equals(ONE_BI)) {
      if (player.totalWinnedGames) {
        player.totalWinnedGames = player.totalWinnedGames.plus(ONE_BI);
      }
      if (player.totalSecondWinnedGames) {
        player.totalSecondWinnedGames = player.totalSecondWinnedGames.plus(
          ONE_BI
        );
      }
    }

    if (event.params.place.equals(SECOND_BI)) {
      if (player.totalWinnedGames) {
        player.totalWinnedGames = player.totalWinnedGames.plus(ONE_BI);
      }
      if (player.totalThirdWinnedGames) {
        player.totalThirdWinnedGames = player.totalThirdWinnedGames.plus(
          ONE_BI
        );
      }
    }

    let earning = Earning.load(`${game.id}-${player.id}`) as Earning;
    if (player.totalEarned) {
      player.totalEarned = player.totalEarned.plus(event.params.amountSend);
    }
    if (player.EarnedMinusSpent) {
      player.EarnedMinusSpent = player.totalEarned.minus(player.totalSpent);
    }

    earning.amount = event.params.amountSend;
    earning.at = event.block.timestamp;
    earning.claimed = true;
    earning.save();
    player.save();
  }
}
