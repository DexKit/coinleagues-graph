import { Game, Player } from "../../generated/schema";
import {
  AbortedGame,
  Claimed,
  CoinLeagues as CoinLeaguesContract,
  EndedGame,
  JoinedGame,
  StartedGame,
} from "../../generated/templates/CoinLeagues/CoinLeagues";
import { ONE_BI, SECOND_BI, ZERO_BI } from "./helpers";


export function handleJoinedGame(event: JoinedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;

  let player = Player.load(event.params.playerAddress.toHexString());
  if (player === null) {
    player = new Player(event.params.playerAddress.toHexString());
    player.totalEarned = ZERO_BI;
    player.totalJoinedGames = ONE_BI;
    player.totalFirstWinnedGames = ZERO_BI;
    player.totalSecondWinnedGames = ZERO_BI;
    player.totalThirdWinnedGames = ZERO_BI;
    player.totalWinnedGames = ZERO_BI;
    player.joinedGames = [];
    player.joinedGames.push(game.id);
    player.save();
  } else {
    if (player.joinedGames) {
      player.joinedGames.push(game.id);
    }

    if (player.totalJoinedGames) {
      player.totalJoinedGames = player.totalJoinedGames.plus(ONE_BI);
    }

    player.save();
  }
  if (game.currentPlayers) {
    game.currentPlayers = game.currentPlayers.plus(ONE_BI);
  }
  if (game.players) {
    game.players.push(event.params.playerAddress.toHexString());
  } else {
    game.players = [];
    game.players.push(event.params.playerAddress.toHexString());
  }

  game.save();
}

export function handleStartedGame(event: StartedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;
  game.status = "Started";
  game.save();
}

export function handleEndedGame(event: EndedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;
  game.status = "Ended";
  game.save();
}

export function handleAbortedGame(event: AbortedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;
  game.status =  "Aborted";
  game.save();
}

export function handleClaimed(event: Claimed): void {
  let player = Player.load(event.params.playerAddress.toHexString());
  // let leaguesContract = CoinLeaguesContract.bind(event.address);

  if (player) {
    if (event.params.place.equals(ZERO_BI)) {
      if (player.winnedGames) {
        player.winnedGames.push(event.address.toHexString());
      } else {
        player.winnedGames = [];
        player.winnedGames.push(event.address.toHexString());
      }
      if (player.winnedFirstGames) {
        player.winnedFirstGames.push(event.address.toHexString());
      } else {
        player.winnedFirstGames = [];
        player.winnedFirstGames.push(event.address.toHexString());
      }

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
      if (player.winnedGames) {
        player.winnedGames.push(event.address.toHexString());
      } else {
        player.winnedGames = [];
        player.winnedGames.push(event.address.toHexString());
      }
      if (player.winnedSecondGames) {
        player.winnedSecondGames.push(event.address.toHexString());
      } else {
        player.winnedSecondGames = [];
        player.winnedSecondGames.push(event.address.toHexString());
      }
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
      if (player.winnedGames) {
        player.winnedGames.push(event.address.toHexString());
      } else {
        player.winnedGames = [];
        player.winnedGames.push(event.address.toHexString());
      }
      if (player.winnedThirdGames) {
        player.winnedThirdGames.push(event.address.toHexString());
      } else {
        player.winnedThirdGames = [];
        player.winnedThirdGames.push(event.address.toHexString());
      }
      if (player.totalWinnedGames) {
        player.totalWinnedGames = player.totalWinnedGames.plus(ONE_BI);
      }
      if (player.totalThirdWinnedGames) {
        player.totalThirdWinnedGames = player.totalThirdWinnedGames.plus(
          ONE_BI
        );
      }
    }
    player.save();
  }
}
