const teams = ["DET Pistons", "LA Lakers"];
const firstqWinner = { teamA: 2.36, teamB: 1.6 };

function convertOdds(odds) {
  let percent = 1 / odds;
  return percent;
}

const probabilities = {
  teamA: convertOdds(firstqWinner.teamA),
  teamB: convertOdds(firstqWinner.teamB),
};
console.log(probabilities.teamA)
console.log(probabilities.teamB)


function firstqWinnerGenerator() {
    while (true) {
        const random = Math.random();
        console.log("Random %", random)
        if (random < probabilities.teamA) {
            yield teams[0]
        } else {
            yield teams[1]
        }
    }
}

const firstqWinResSim = firstqWinnerGenerator;
console.log(firstqWinResSim)