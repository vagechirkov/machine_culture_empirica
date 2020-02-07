import Empirica from "meteor/empirica:core";

import { Solutions } from "./solution";
import { Networks } from "./network";
import { Chains } from "./chain";

Empirica.onRoundStart((game, round, players) => {
  const experimentName = game.get("experimentName");
  const { batchId } = game;
  players.forEach(player => {
    console.log(
      `Loading network for player ${player._id}, experiment ${experimentName}`
    );

    const chain = Chains.loadNextChainForPlayer(player.id);
    const network = Networks.loadById(chain.networkId);
    const solutions = Solutions.loadForChain(chain._id);

    /*
     * We store the network on the `player.round` object instead of the round object.
     * If there are multiple players in the game then each player should have a different network.
     */
    player.round.set("network", network);
    player.round.set("chain", chain);
    player.round.set(
      "previousSolutionInChain",
      (solutions && solutions.length && solutions[solutions.length - 1]) || {
        actions: []
      }
    );
  });
});

Empirica.onRoundEnd((game, round, players) => {
  const { batchId, treatment } = game;
  players.forEach(player => {
    const network = player.round.get("network");
    if (network.experimentName === "practice") {
      return;
    }
    console.log(
      `Saving solution game: ${game._id} player: ${player.id} round: ${round._id}`
    );
    const solution = player.round.get("solution") || {};
    const chain = player.round.get("chain");
    Solutions.create({
      ...solution,
      batchId,
      treatment,
      chainId: chain._id,
      experimentApplicationVersion: "2.0--2019-02-05",
      playerId: player.id
    });
    player.set("score", (player.get("score") || 0) + solution.totalReward);
  });

  // TODO if the next solution is a robot solution then add that solution
});

// onGameEnd is triggered when the game ends.
// It receives the same options as onGameStart.
Empirica.onGameEnd((game, players) => {});
