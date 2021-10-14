import { Winned } from "../../generated/CoinLeaguesFactoryRoles/CoinLeagues";
import { Earning, Game, Player, PlayerGame } from "../../generated/schema";
import {
  AbortedGame,
  Claimed,
  EndedGame,
  JoinedGame,
  StartedGame,
  WinnedMultiple,
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
   
    player.save();
  } else {
    
    if (player.totalJoinedGames) {
      player.totalJoinedGames = player.totalJoinedGames.plus(ONE_BI);
    }

    player.save();
  }
  
  
  if (game.currentPlayers) {
    game.currentPlayers = game.currentPlayers.plus(ONE_BI);
  }
 
  if(player && game){
    const playerGame = new PlayerGame(`${game.id}-${player.id}`)
    playerGame.game = game.id;
    playerGame.player = player.id;
    playerGame.save();
  }
  const playerAddresses = game.playerAddresses;
  playerAddresses.push(event.params.playerAddress);
  game.playerAddresses = playerAddresses;

  game.save();
}

export function handleStartedGame(event: StartedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;
  game.status = "Started";
  game.startedAt = event.params.timestamp;
  game.save();
}

export function handleEndedGame(event: EndedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;
  game.endedAt = event.params.timestamp;
  game.status = "Ended";
  game.save();
}

export function handleAbortedGame(event: AbortedGame): void {
  let game = Game.load(event.address.toHexString()) as Game;
  game.abortedAt = event.params.timestamp;
  game.status =  "Aborted";  
  game.save();
}

export function handleWinned(event: Winned): void {
  let game = Game.load(event.address.toHexString()) as Game;
  let player = Player.load(event.params.first.toHexString()) as Player;
  let earning = new Earning(`${game.id}-${player.id}`);
  earning.game = game.id;
  earning.player = player.id;
  earning.place = ZERO_BI;
  earning.amount = ZERO_BI;
  earning.save();
}

export function handleWinnedMultiple(event: WinnedMultiple): void {
  let game = Game.load(event.address.toHexString()) as Game;
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
  let player = Player.load(event.params.playerAddress.toHexString());
  // let leaguesContract = CoinLeaguesContract.bind(event.address);
  let game = Game.load(event.address.toHexString()) as Game;
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
    earning.amount = event.params.amountSend;
    earning.at = event.block.timestamp;
    earning.claimed = true;
    earning.save();
    player.save();
  }
}
