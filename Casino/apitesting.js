const API_KEY = "743ecb6572msh7921b757954e5b6p17850cjsn40bf0515f96d";
const BASE_URL = "https://api.the-odds-api.com";
//import { AddData } from "./casino-functions.js";

// Function to extract and format the data
function filterGameData(data) {
  const { commence_time, away_team, home_team, bookmakers } = data;

  // Find the bookmaker entry for 'fanduel'
  const fanduelData = bookmakers.find(
    (bookmaker) => bookmaker.key === "fanduel"
  );

  // Extract specific markets from Fanduel data
  const h2h =
    fanduelData?.markets.find((market) => market.key === "h2h") || null;
  const spreads =
    fanduelData?.markets.find((market) => market.key === "spreads") || null;
  const totals =
    fanduelData?.markets.find((market) => market.key === "totals") || null;

  // Return the organized object
  return {
    commence_time,
    away_team,
    home_team,
    h2h, // Head-to-head market
    spreads, // Spreads market
    totals, // Totals market
  };
}
window.betsCart = [];
/**
 * Appends bet details to the cart array.
 * @param {string} userId - The ID of the user placing the bet.
 * @param {string} betName - The name of the bet.
 * @param {number} odds - The odds for the bet.
 * @param {string} gameLink - The formatted game link or description.
 */
export function appendGameDataToBetCart(
  userId,
  betName,
  odds,
  gameTeams,
  gameDate
) {
  const exists = betsCart.some((bet) => bet[1] === betName);

  if (!exists) {
    const cartItems = betsCart.length;
    betsCart.push([userId, betName, odds, gameTeams, gameDate, cartItems]);
    console.log("Updated Bets Cart: ", betsCart);
  } else {
    console.log("bet already exists");
  }
  printBetCart();

  return betsCart.length;
}

export function printBetCart() {
  const betCart = document.getElementById("betCart");
  const totalPayoutDiv = document.getElementById("totalPayout"); // Create a div for the total payout
  const parlayPayoutOdds = document.getElementById("parlayPayoutOdds"); // Create a div for the total payout

  totalPayoutDiv.textContent = "$0.00";
  betCart.innerHTML = ""; // Clear the cart

  function calculateParlayPayout() {
    console.log("calculateParlayPayout", betsCart);
    let totalOdds = betsCart.reduce((product, bet) => {
      const odds = parseFloat(bet[2].replace(/['"]+/g, "")); // Remove extra quotes
      return product * odds; // Multiply the odds
    }, 1); // Start with 1 because it's a multiplication

    const betInput = document.querySelector("#parlayWager"); // Select by id
    const toWinInput = document.querySelector("#parlayReturn"); // Select by id
    betInput.addEventListener("input", () => {
      const wager = parseFloat(betInput.value) || 0; // Get the wager input, default to 0 if invalid
      const potentialWin = wager * totalOdds; // Calculate the potential win
      toWinInput.value = potentialWin.toFixed(2); // Update the To Win input with 2 decimal places
    });
    totalOdds = totalOdds.toFixed(2);

    console.log("parlay Total Odds:", totalOdds);
    parlayPayoutOdds.textContent = `${totalOdds}`;
  }
  function calculatePayout() {
    const payout = betsCart.reduce((total, bet) => total + (bet[7] || 0), 0);
    totalPayoutDiv.textContent = `$${payout.toFixed(2)}`; // Update the payout display
  }

  function ParlaySlip() {
    // Check if the parlay slip container already exists
    let existingParlayBetLink = document.querySelector(
      "#parlay-slip-container"
    );

    if (!existingParlayBetLink) {
      // If it doesn't exist, create it
      existingParlayBetLink = document.createElement("div");
      existingParlayBetLink.id = "parlay-slip-container"; // Add an ID
      existingParlayBetLink.classList.add("parlay-slip-container");
      betCart.appendChild(existingParlayBetLink); // Append it to betCart
    }

    // Clear existing content
    existingParlayBetLink.innerHTML = "";

    // Style the parlay slip container
    existingParlayBetLink.style.borderRadius = "10px";
    existingParlayBetLink.style.marginLeft = "15px";
    existingParlayBetLink.style.marginTop = "10px";
    existingParlayBetLink.style.width = "230px";
    existingParlayBetLink.style.height = "auto";
    existingParlayBetLink.style.backgroundColor = "rgb(232, 234, 237)";
    existingParlayBetLink.style.fontFamily = "sans-serif";

    // Add the header
    const testing = document.createElement("div");
    testing.textContent = "Parlay";
    testing.style.display = "flex"; // Make the container a flexbox
    testing.style.alignItems = "center"; // Center the content vertically
    testing.style.fontSize = "18px";
    testing.style.marginBottom = "5px";
    testing.style.width = "190px";
    testing.style.height = "25px";
    testing.style.alignItems = "center";
    testing.style.borderRadius = "8px 8px 0 0";
    testing.style.backgroundColor = "#7F7D9C";
    testing.style.color = "white";
    testing.style.padding = "3px 20px";
    existingParlayBetLink.appendChild(testing);

    // Create and append parlay legs
    const parlayLegContainer = document.createElement("div");
    parlayLegContainer.classList.add("parlay-leg-container");

    // Add content dynamically from betsCart
    betsCart.forEach((bet, index) => {
      let betName = bet[1];
      console.log("betname before split", betName);
      betName = betName.split(" ");

      let status;
      let legProp;
      let teamName;
      if (betName.includes("MoneyLine")) {
        console.log("this bet name contains moneyline");
        status = betName.pop();
        legProp = betName.pop();
        teamName = betName.join(" ");
        teamName = teamName.replace("[", "");
        teamName = teamName.replace('"', "");
      } else if (betName.includes("spread")) {
        console.log("this bet name contains spread");

        status = betName.pop();
        let line = betName.pop();
        let prop = betName.pop();
        prop = prop.charAt(0).toUpperCase() + prop.slice(1);

        console.log("Line value:", line);
        console.log("Type of line:", typeof line);
        const numericLine = parseFloat(line);
        console.log("numeric line:", numericLine);
        if (numericLine < 0) {
          legProp = prop + ":" + " " + line;
        } else if (numericLine > 0) {
          legProp = prop + ":" + " " + "+" + line;
        }
        teamName = betName.join(" ");
        teamName = teamName.replace("[", "");
        teamName = teamName.replace('"', "");
        console.log("this is the teamName", teamName);
      } else {
        console.log("this bet name contains Totals");
        let legMatchup = bet[3];
        console.log("this is the leg matchup", legMatchup);
        const teams = legMatchup.split(" @ ");

        // Get the last word of each team name
        const team1 = teams[0].split(" ").pop(); // Last word of the first team
        const team2 = teams[1].split(" ").pop(); // Last word of the second team

        // Combine the simplified names
        teamName = `${team1} @ ${team2}`;

        status = betName.pop();
        let line = betName.pop();
        let prop = betName.pop();
        prop = prop.charAt(0).toUpperCase() + prop.slice(1);
        legProp = `${prop} ${line}`;
        console.log("Line value:", line);
        console.log("Type of line:", typeof line);
        const numericLine = parseFloat(line);
        console.log("numeric line:", numericLine);

        /*
        teamName = betName.join(" ");
        teamName = teamName.replace("[", "");
        teamName = teamName.replace('"', "");
        console.log("this is the teamName", teamName);
        */
      }

      const legOdds = bet[2].replace(/"/g, "");
      const legMatchup = bet[3];
      const legTime = bet[4];
      const ParlaylegTime = legTime.replace("•", "");
      // Create elements for each parlay leg
      const parlayTopHeader = document.createElement("div");
      parlayTopHeader.style.display = "flex";
      const parlayTeam = document.createElement("div");
      parlayTeam.textContent = `${teamName}`;
      parlayTeam.style.fontSize = "16px";
      parlayTeam.style.fontWeight = "550";
      parlayTeam.style.width = "160px";

      const parlayOdds = document.createElement("div");
      parlayOdds.textContent = `${legOdds}`;
      parlayOdds.style.fontWeight = "550";
      parlayOdds.style.textAlign = "right";
      parlayOdds.style.width = "40px";
      parlayTopHeader.appendChild(parlayTeam);
      parlayTopHeader.appendChild(parlayOdds);

      const parlayProp = document.createElement("div");
      parlayProp.textContent = `${legProp}`;
      parlayProp.style.fontSize = "16px";
      parlayProp.style.color = "rgb(36, 38, 41)";
      parlayProp.style.marginBottom = "5px";
      const parlayBotHeader = document.createElement("div");
      parlayBotHeader.style.display = "flex";
      parlayBotHeader.style.alignItems = "center";
      const teams = document.createElement("div");
      teams.textContent = `${legMatchup}`;
      teams.style.fontSize = "12px";
      teams.style.fontStyle = "italic";

      teams.style.color = "rgb(28, 28, 31)";
      teams.style.width = "200px";
      const time = document.createElement("div");
      time.textContent = `${ParlaylegTime}`;
      time.style.fontSize = "12px";
      time.style.color = "black";
      time.style.paddingLeft = "50px";
      parlayBotHeader.style.paddingLeft = "19px";
      parlayBotHeader.style.paddingRight = "3px";
      parlayBotHeader.appendChild(teams);
      parlayBotHeader.appendChild(time);
      parlayBotHeader.style.paddingBottom = "15px";
      parlayTopHeader.style.marginLeft = "15px";
      parlayProp.style.marginLeft = "15px";
      // Append elements to parlayLegContainer
      parlayLegContainer.appendChild(parlayTopHeader);
      parlayLegContainer.appendChild(parlayProp);
      parlayLegContainer.appendChild(parlayBotHeader);
    });
    // Append parlayLegContainer to the existingParlayBetLink
    existingParlayBetLink.appendChild(parlayLegContainer);
  }

  betsCart.forEach((bet, index) => {
    const [
      userId,
      betName,
      odds,
      gameTeams,
      gameDate,
      cartItems,
      wager = 0,
      potentialReturn = 0,
    ] = bet; // Default wager and potentialReturn to 0

    const betLink = document.createElement("div");
    betLink.setAttribute("item-number", `${cartItems}`);

    betLink.style.borderRadius = "10px";
    betLink.style.marginLeft = "15px";
    betLink.style.marginTop = "10px";
    betLink.style.width = "230px";
    betLink.style.height = "130px";
    betLink.style.backgroundColor = "rgb(232, 234, 237)";
    betLink.style.fontFamily = "sans-serif";

    const parlayBetLink = document.createElement("div");
    parlayBetLink.style.borderRadius = "10px";
    parlayBetLink.style.marginLeft = "15px";
    parlayBetLink.style.marginTop = "10px";
    parlayBetLink.style.width = "230px";
    parlayBetLink.style.height = "130px";
    parlayBetLink.style.backgroundColor = "rgb(232, 234, 237)";
    parlayBetLink.style.fontFamily = "sans-serif";
    const testing = document.createElement("div");
    testing.textContent = "Parlay";
    testing.style.marginBottom = "5px";
    testing.style.width = "210px";
    testing.style.height = "25px";
    testing.style.borderRadius = "8px 8px 0 0";
    testing.style.border = "none";
    testing.style.backgroundColor = "#7F7D9C";
    testing.style.color = "white";
    testing.style.paddingBottom = "3px";
    testing.style.paddingLeft = "20px";
    testing.style.paddingTop = "5px";
    parlayBetLink.appendChild(testing);

    const parlayLegContainer = document.createElement("div");
    console.log("does this update?", betsCart);
    for (let i = 0; i < betsCart.length; i++) {
      console.log(`Bet ${i + 1}:`);
      let legName = betsCart[i][1];
      legName = legName.replace(/[\[\]]/g, "");
      legName = legName.replace(/"/g, "");
      let legNameArray = legName.split(" ");

      const status = legNameArray.pop();
      const legProp = legNameArray.pop();
      const teamName = legNameArray.join(" ");
      let legOdds = betsCart[i][2];
      legOdds = legOdds.replace(/"/g, "");
      let legMatchup = betsCart[i][3];
      let legTime = betsCart[i][4];
      console.log("legProp", legProp);
      console.log("teamName", teamName);
      const parlayTopHeader = document.createElement("div");
      parlayTopHeader.style.display = "flex";
      const parlayTeam = document.createElement("div");
      parlayTeam.textContent = `${teamName}`;
      const parlayOdds = document.createElement("div");
      parlayOdds.textContent = `${legOdds}`;
      parlayTopHeader.appendChild(parlayTeam);
      parlayTopHeader.appendChild(parlayOdds);
      parlayLegContainer.appendChild(parlayTopHeader);
      const parlayProp = document.createElement("div");
      parlayProp.textContent = `${legProp}`;
      parlayLegContainer.appendChild(parlayProp);
      const parlayBotHeader = document.createElement("div");
      parlayBotHeader.style.display = "flex";
      const teams = document.createElement("div");
      teams.textContent = `${legMatchup}`;
      const time = document.createElement("div");
      teams.textContent = `${legTime}`;
      parlayBotHeader.appendChild(teams);
      parlayBotHeader.appendChild(time);
      parlayLegContainer.appendChild(parlayBotHeader);
      parlayBetLink.appendChild(parlayLegContainer);
      // Iterate through indices 1 to 4 of the current nested array
      console.log(legName + " " + legOdds + legMatchup + legTime);
    }
    console.log("this is the bet name", betName);
    let NewbetName = betName.replace(/[\[\]]/g, ""); // Removes "[" and "]"
    NewbetName = NewbetName.replace(/"/g, ""); // Removes all occurrences of "

    // how to make it work for totals and spreads
    let betNameArray = NewbetName.split(" ");
    let status;
    let propName;
    let teamName;
    let oddsName;
    if (betNameArray.includes("MoneyLine")) {
      console.log("this bet name contains moneyline");
      status = betNameArray.pop();
      propName = betNameArray.pop();
      teamName = betNameArray.join(" ");
      oddsName = odds.replace(/"/g, "");
    } else if (betNameArray.includes("spread")) {
      console.log("this bet contains spread");
      console.log("this is the data", betNameArray);
      status = betNameArray.pop();
      let line = betNameArray.pop();
      let prop = betNameArray.pop();
      prop = prop.charAt(0).toUpperCase() + prop.slice(1);
      console.log("Line value:", line);
      console.log("Type of line:", typeof line);
      const numericLine = parseFloat(line);
      console.log("numeric line:", numericLine);
      if (numericLine < 0) {
        propName = prop + ":" + " " + line;
      } else if (numericLine > 0) {
        propName = prop + ":" + " " + "+" + line;
      }
      teamName = betNameArray.join(" ");
      oddsName = odds.replace(/"/g, "");
    } else {
      console.log("this bet name contains Totals");

      status = betNameArray.pop();
      let line = betNameArray.pop();
      let prop = betNameArray.pop();
      prop = prop.charAt(0).toUpperCase() + prop.slice(1);
      propName = prop + " " + line;
      const teams = gameTeams.split(" @ ");

      // Get the last word of each team name
      const team1 = teams[0].split(" ").pop(); // Last word of the first team
      const team2 = teams[1].split(" ").pop(); // Last word of the second team

      // Combine the simplified names
      teamName = `${team1} @ ${team2}`;
      console.log("this is the gameTeams", gameTeams);
      oddsName = odds.replace(/"/g, "");
    }

    console.log("teamName", teamName);
    console.log("propName", propName);
    const betSlipContainer = document.createElement("div");
    const gameInfo = document.createElement("div");
    //gameInfo.style.backgroundColor = "lightpink";

    gameInfo.style.marginBottom = "5px";
    gameInfo.style.width = "208px";
    gameInfo.style.borderRadius = "8px 8px 0 0";
    gameInfo.style.border = "none";
    gameInfo.style.backgroundColor = "#7F7D9C";
    gameInfo.style.color = "white";
    gameInfo.style.paddingBottom = "3px";
    console.log(gameTeams);
    const parts = gameTeams.split(" @ ");
    const team1 = parts[0]; // "Washington Wizards"
    const delimiter = "@"; // "@"
    const team2 = parts[1]; // "Boston Celtics"

    // Log the results
    console.log("Team 1:", team1);
    console.log("Delimiter:", delimiter);
    console.log("Team 2:", team2);
    let otherTeam = "";
    if (team1 === teamName) {
      otherTeam = "Away: " + team2;
    } else {
      otherTeam = "Home:  " + team1;
    }

    const gameInfoDate = document.createElement("div");
    gameInfoDate.textContent = `${gameDate}`;
    gameInfoDate.style.fontSize = "12px";
    gameInfoDate.style.color = "white";
    const gameInfoTeams = document.createElement("div");
    gameInfoTeams.textContent = `${otherTeam}`;
    gameInfoTeams.style.fontSize = "14px";
    gameInfo.style.paddingLeft = "19px";
    gameInfo.style.paddingRight = "3px";
    gameInfo.appendChild(gameInfoTeams);
    gameInfo.appendChild(gameInfoDate);

    betSlipContainer.appendChild(gameInfo);

    const betInfo = document.createElement("div");
    const betInfoData = document.createElement("div");
    const betInfoProp = document.createElement("div");
    const betInfoTeam = document.createElement("div");
    const betInfoOdds = document.createElement("div");
    const removeBtn = document.createElement("button");
    const betInfoContainer = document.createElement("div");

    betInfoContainer.classList.add("flex-container");

    betInfoContainer.style.display = "flex";
    betInfoContainer.style.justifyContent = "space-between";
    //betInfoContainer.style.backgroundColor = "lightgreen";
    betInfoContainer.style.marginTop = "5px";
    betInfoContainer.style.marginBottom = "5px";

    betInfoContainer.style.width = "225px";
    betInfoOdds.textContent = `${oddsName}`;
    betInfoTeam.textContent = `${teamName}`;
    betInfoProp.textContent = `${propName}`;
    betInfoTeam.style.fontSize = "16px";
    betInfoTeam.style.fontWeight = "550";
    betInfoTeam.style.width = "170px";
    betInfoProp.style.fontSize = "12px";
    betInfoOdds.style.fontWeight = "550";
    betInfoProp.style.color = "rgb(36, 38, 41)";
    const betInfoTopHeader = document.createElement("div");
    betInfoTopHeader.style.display = "flex";
    betInfoTopHeader.style.marginBottom = "2px";
    betInfoTopHeader.appendChild(betInfoTeam);
    betInfoTopHeader.appendChild(betInfoOdds);
    const betInfoBotHeader = document.createElement("div");
    betInfoBotHeader.style.display = "flex";
    betInfoBotHeader.style.justifyContent = "space-between";
    betInfoBotHeader.style.width = "205px";
    betInfoProp.style.width = "190px";
    betInfoBotHeader.appendChild(betInfoProp);
    betInfo.appendChild(betInfoTopHeader);
    betInfo.appendChild(betInfoBotHeader);

    betInfo.style.flex = "55"; // BetInfo takes 3 parts of the space

    removeBtn.style.flex = "1"; // RemoveBtn takes 1 part of the space
    removeBtn.textContent = "X";
    removeBtn.style.backgroundColor = "transparent";
    removeBtn.style.border = "none";
    removeBtn.style.fontSize = "10px";
    removeBtn.style.fontWeight = "bold";
    removeBtn.width = "10px";
    betInfoContainer.style.alignItems = "center";
    betInfoContainer.appendChild(removeBtn);

    betInfoContainer.appendChild(betInfo);

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";

    const betInputContainer = document.createElement("div");
    const betLabel = document.createElement("div");
    betLabel.textContent = "Wager";
    betInputContainer.appendChild(betLabel);

    const betInput = document.createElement("input");
    betInput.style.width = "90px";
    betInput.type = "number";
    betInput.placeholder = "Enter your wager";
    betInput.min = "0";

    betInput.value = wager; // Set the value from the array
    betInput.style.height = "20px";
    betInputContainer.appendChild(betInput);
    betInputContainer.style.width = "90px";
    betInputContainer.style.fontSize = "14px";
    betInputContainer.style.alignItems = "center";
    const betOutputContainer = document.createElement("div");
    betOutputContainer.textContent = "To Win";
    betOutputContainer.style.fontSize = "14px";
    const betOutput = document.createElement("input");
    betOutput.type = "number";
    betOutput.placeholder = "$0.00";
    betOutput.style.width = "50px";
    betOutput.readOnly = true;
    betOutput.style.width = "85px";
    betOutputContainer.appendChild(betOutput);
    betOutputContainer.style.width = "80px";
    betOutputContainer.style.marginLeft = "20px";
    betOutput.style.height = "20px";
    inputContainer.appendChild(betInputContainer);
    inputContainer.appendChild(betOutputContainer);
    inputContainer.style.marginLeft = "19px";
    inputContainer.style.width = "240px";

    const oddsNum = odds.replace(/[\[\]"]/g, "");
    const numericOdds = parseFloat(oddsNum);

    // Update the output value dynamically
    betInput.addEventListener("input", () => {
      const inputValue = parseFloat(betInput.value); // Get the user's input
      const calculatedValue = isNaN(inputValue) ? 0 : inputValue * numericOdds; // Multiply input by odds
      const roundedValue = parseFloat(calculatedValue.toFixed(2));
      betOutput.value = roundedValue; // Update the output field

      // Update the wager and potential return in the array
      betsCart[index][6] = inputValue; // Update wager value
      betsCart[index][7] = roundedValue; // Update potential return value

      calculatePayout(); // Recalculate and update total payout
    });

    // Update the output field on initial render
    const calculatedValue = isNaN(wager) ? 0 : wager * numericOdds;
    const roundedValue = parseFloat(calculatedValue.toFixed(2)); // Round to two decimals
    betOutput.value = roundedValue; // Update the output field
    betsCart[index][7] = roundedValue;

    betLink.appendChild(gameInfo);
    betLink.appendChild(betInfoContainer);

    inputContainer.classList.add("input-container"); // Use class instead of id
    betLink.appendChild(inputContainer);
    betLink.classList.add("betLink"); // Use class instead of id

    betCart.appendChild(betLink);

    document.dispatchEvent(new Event("inputContainerLoaded"));
    const sButton = document.getElementById("straightButton");
    const pButton = document.getElementById("parlayButton");
    const inputContainers = document.querySelectorAll(".input-container");
    const betLinkContainers = document.querySelectorAll(".betLink");
    const parlayLinkContainer = document.querySelector(
      ".parlay-slip-container"
    );
    function toggleContainers(showStraight) {
      // Toggle visibility of inputContainers
      inputContainers.forEach((container) => {
        container.style.display = showStraight ? "flex" : "none";
      });

      // Toggle visibility of betLinkContainers
      betLinkContainers.forEach((container) => {
        container.style.display = showStraight ? "block" : "none";
      });

      // Toggle visibility of parlaySlipContainer
      const parlaySlipContainer = document.querySelector(
        "#parlay-slip-container"
      );
      if (parlaySlipContainer) {
        parlaySlipContainer.style.display = showStraight ? "none" : "block";
      }
      const straightPayoutBox = document.querySelector("#straightPayoutBox");
      const betCart = document.getElementById("betCart");
      const parlayInput = document.getElementById("parlayInput");
      if (straightPayoutBox) {
        straightPayoutBox.style.display = showStraight ? "flex" : "none";
        betCart.style.height = showStraight ? "240px" : "230px";
        parlayInput.style.display = showStraight ? "none" : "block";
      }

      // Call ParlaySlip only if "PARLAY" is selected
      if (!showStraight) {
        ParlaySlip();
      }
    }

    console.log("cartItems", cartItems);
    if (cartItems === 0) {
      toggleContainers(true); // Show the input containers

      pButton.classList.remove("active");
      sButton.classList.add("active");
    } else {
      sButton.addEventListener("click", () => {
        toggleContainers(true); // Show the input containers
        pButton.classList.remove("active");
        sButton.classList.add("active");
      });

      // Hide inputContainer when parButton is clicked
      pButton.addEventListener("click", () => {
        toggleContainers(false);
        pButton.classList.add("active");
        sButton.classList.remove("active");
      });
    }
  });

  calculatePayout(); // Initial calculation of total payout
  calculateParlayPayout();
}

// Function to dynamically create and append game data elements
function appendGameDataToDOM(gameData) {
  const gameSchedule = document.getElementById("gameSchedule");
  const today = new Date().toISOString().split("T")[0]; // Extract only the date part

  gameData.forEach((game) => {
    const { commence_time, away_team, home_team, h2h, spreads, totals } =
      filterGameData(game);
    /*
    console.log(commence_time);
    const commenceDate = new Date(commence_time).toISOString().split("T")[0]; // Extract the date part
    console.log("today", today);
    console.log("commence date", commenceDate);
    */
    // Proceed only if all markets are available
    if (h2h && spreads && totals /*commenceDate === today*/) {
      // Create a wrapper div for each game

      const homeTeamH2hVar = h2h.outcomes[0];
      const awayTeamH2hVar = h2h.outcomes[1];

      const homeTeamSpreadVar = spreads.outcomes[0];
      const awayTeamSpreadVar = spreads.outcomes[1];

      const homeTeamTotalVar = totals.outcomes[0];
      const awayTeamTotalVar = totals.outcomes[1];

      console.log(awayTeamH2hVar.name);
      console.log(homeTeamH2hVar.name);
      const gameHeader = document.createElement("div");
      gameHeader.classList.add("gameHeader");

      const awayheaderLeft = document.createElement("div");
      awayheaderLeft.classList.add("awayheaderLeft");

      const sgpButton = document.createElement("button");
      sgpButton.classList.add("sgpButton");
      sgpButton.textContent = "SGP";

      awayheaderLeft.appendChild(sgpButton);

      const commenceTimeDiv = document.createElement("div");
      commenceTimeDiv.classList.add("commenceTime");

      // Format commence_time for readability
      const commenceDate = new Date(commence_time);

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short", // Abbreviated month (e.g., "Nov")
        day: "numeric", // Numeric day (e.g., "22")
        hour: "numeric", // Hour (e.g., "7")
        minute: "2-digit", // Minute with leading zero (e.g., "10")
        hour12: true, // Use 12-hour format with AM/PM
      }).format(commenceDate);
      const [datePart, timePart] = formattedDate.split(", ");
      const formattedDateString = `${datePart} • ${timePart}`;
      commenceTimeDiv.textContent = ` ${formattedDateString}`;

      awayheaderLeft.appendChild(commenceTimeDiv);

      const gameWrapper = document.createElement("div");
      gameWrapper.classList.add("container");

      // Create individual divs for each data field
      const homeTeamDiv = document.createElement("div");
      homeTeamDiv.classList.add("homeTeam");

      const awayTeamDiv = document.createElement("div");
      awayTeamDiv.classList.add("awayTeam");

      gameHeader.appendChild(awayheaderLeft);

      const headerSpread = document.createElement("div");
      headerSpread.classList.add("headerSpread");
      headerSpread.textContent = `Spread`;

      const headerTotal = document.createElement("div");
      headerTotal.classList.add("headerTotal");
      headerTotal.textContent = `Total`;

      const headerMoney = document.createElement("div");
      headerMoney.classList.add("headerMoney");
      headerMoney.textContent = `Money`;

      gameHeader.appendChild(headerSpread);
      gameHeader.appendChild(headerTotal);
      gameHeader.appendChild(headerMoney);

      gameWrapper.appendChild(gameHeader);
      // Append basic info to gameWrapper

      const parentAwayContainer = document.createElement("div");
      parentAwayContainer.classList.add("parentAwayContainer");

      const awayTeam = document.createElement("div");
      awayTeam.classList.add("awayTeam");

      const awayTeamIcon = document.createElement("div");
      awayTeamIcon.classList.add("awayTeamIcon");

      const awayTeamImg = document.createElement("img");
      awayTeamImg.classList.add("awayTeamIconSize"); // Add this class

      const logoFolderPath = "./team_Logo/";
      const awayTeamNamelogo = awayTeamH2hVar.name; // Example: "Cleveland Cavaliers"

      const formattedTeamName = awayTeamNamelogo
        .toLowerCase()
        .replace(/ /g, "-");

      // Construct the file name
      const logoFileName = `nba-${formattedTeamName}-logo.png`;
      console.log(formattedTeamName);
      // Full path to the logo
      const logoFilePath = `${logoFolderPath}${logoFileName}`;

      awayTeamImg.src = logoFilePath;
      awayTeamImg.alt = ""; // Add the alt attribute to match

      awayTeamIcon.appendChild(awayTeamImg);
      awayTeam.appendChild(awayTeamIcon);
      parentAwayContainer.appendChild(awayTeam);

      const awayTeamFont = document.createElement("div");
      awayTeamFont.classList.add("awayTeamFont");

      const awayTeamName = document.createElement("div");
      awayTeamName.style.fontWeight = "bold";
      awayTeamName.textContent = awayTeamSpreadVar.name;

      const awayTeamStats = document.createElement("div");
      awayTeamStats.textContent = "7-4, 6th Western";

      awayTeamFont.appendChild(awayTeamName);
      awayTeamFont.appendChild(awayTeamStats);
      awayTeam.appendChild(awayTeamFont);
      parentAwayContainer.appendChild(awayTeam);

      const awayTeamSpreadButtonContainer = document.createElement("div");
      awayTeamSpreadButtonContainer.classList.add(
        "awayTeamSpreadButtonContainer"
      );

      const awayTeamSpreadButton = document.createElement("button");

      awayTeamSpreadButton.classList.add("awayTeamSpreadButton", "add");
      awayTeamSpreadButton.setAttribute("data-user-id", "markamiri1");
      awayTeamSpreadButton.setAttribute(
        "data-bet-name",
        `"[${awayTeamSpreadVar.name} spread ${awayTeamSpreadVar.point} unsettled]"`
      );
      awayTeamSpreadButton.setAttribute(
        "data-odds",
        `"${awayTeamSpreadVar.price}"`
      );
      awayTeamSpreadButton.setAttribute(
        "data-game-teams",
        `${awayTeamSpreadVar.name} @ ${homeTeamSpreadVar.name}`
      );

      awayTeamSpreadButton.setAttribute(
        "data-game-date",
        ` ${formattedDateString}`
      );

      //temporary testing button
      awayTeamSpreadButton.setAttribute("data-wagered", "20");
      console.log();
      awayTeamSpreadButton.addEventListener("click", function () {
        //console.log("Button attributes:");
        //console.log("user-id:", this.getAttribute("data-user-id"));
        //console.log("bet-name:", this.getAttribute("data-bet-name"));
        //console.log("odds:", this.getAttribute("data-odds"));
        //console.log("wagered:", this.getAttribute("data-wagered"));
        console.log("game Link", this.getAttribute("data-game-link"));
        const userId = this.getAttribute("data-user-id");
        const betName = this.getAttribute("data-bet-name");
        const odds = this.getAttribute("data-odds");
        const wagered = this.getAttribute("data-wagered");
        const gameTeams = this.getAttribute("data-game-teams");
        const gameDate = this.getAttribute("data-game-date");
        //addData(userId, betName, odds, wagered);
        const cartLen = appendGameDataToBetCart(
          userId,
          betName,
          odds,
          gameTeams,
          gameDate
        ); // Call AddData function

        itemsInCart.textContent = cartLen;
        /*
        if (cartLen > 1) {
          straightButton.classList.remove("active");
          parlayButton.classList.add("active");
          toggleInputVisibility(true);
        } else if (cartLen === 1) {
          parlayButton.classList.remove("active");
          straightButton.classList.add("active");
          toggleInputVisibility(false);
        }
        */
      });
      const awayTeamSpreadLine = document.createElement("div");
      awayTeamSpreadLine.classList.add("awayTeamSpreadLine");
      awayTeamSpreadLine.textContent = awayTeamSpreadVar.point;

      const awayTeamSpreadLineOdds = document.createElement("div");
      awayTeamSpreadLineOdds.classList.add("awayTeamSpreadLineOdds");
      awayTeamSpreadLineOdds.textContent = awayTeamSpreadVar.price;

      awayTeamSpreadButton.appendChild(awayTeamSpreadLine);
      awayTeamSpreadButton.appendChild(awayTeamSpreadLineOdds);

      const awayTeamOUButtonContainer = document.createElement("div");
      awayTeamSpreadButtonContainer.classList.add("awayTeamOUButtonContainer");

      const awayTeamOUButton = document.createElement("button");
      awayTeamOUButton.classList.add("awayTeamOUButton", "add");

      awayTeamOUButton.setAttribute("data-user-id", "markamiri1");
      awayTeamOUButton.setAttribute(
        "data-bet-name",
        `"[${awayTeamH2hVar.name} ${awayTeamTotalVar.name} ${awayTeamTotalVar.point} unsettled]"`
      );
      awayTeamOUButton.setAttribute("data-odds", `"${awayTeamTotalVar.price}"`);
      awayTeamOUButton.setAttribute("data-wagered", "20");
      awayTeamOUButton.setAttribute(
        "data-game-teams",
        `${awayTeamH2hVar.name} @ ${homeTeamH2hVar.name}`
      );
      awayTeamOUButton.setAttribute(
        "data-game-date",
        ` ${formattedDateString}`
      );
      awayTeamOUButton.addEventListener("click", function () {
        console.log("game Link", this.getAttribute("data-game-link"));
        const userId = this.getAttribute("data-user-id");
        const betName = this.getAttribute("data-bet-name");
        const odds = this.getAttribute("data-odds");
        const wagered = this.getAttribute("data-wagered");
        const gameTeams = this.getAttribute("data-game-teams");
        const gameDate = this.getAttribute("data-game-date");
        //addData(userId, betName, odds, wagered);
        const cartLen = appendGameDataToBetCart(
          userId,
          betName,
          odds,
          gameTeams,
          gameDate
        );
        itemsInCart.textContent = cartLen;
      });

      const awayTeamOULine = document.createElement("div");
      awayTeamOULine.classList.add("awayTeamOULine");
      awayTeamOULine.textContent =
        awayTeamTotalVar.name + " " + awayTeamTotalVar.point;

      const awayTeamOULineOdds = document.createElement("div");
      awayTeamOULineOdds.classList.add("awayTeamOULineOdds");
      awayTeamOULineOdds.textContent = awayTeamTotalVar.price;

      awayTeamOUButton.appendChild(awayTeamOULine);
      awayTeamOUButton.appendChild(awayTeamOULineOdds);

      awayTeamOUButtonContainer.appendChild(awayTeamOUButton);

      const awayMoneyContainer = document.createElement("div");
      awayMoneyContainer.classList.add("awayMoneyContainer");

      const awayTeamMLButton = document.createElement("button");
      awayTeamMLButton.classList.add("awayTeamMLButton", "add");
      awayTeamMLButton.setAttribute("data-user-id", "markamiri1");
      awayTeamMLButton.setAttribute(
        "data-bet-name",
        `"[${awayTeamH2hVar.name} MoneyLine unsettled]"`
      );
      awayTeamMLButton.setAttribute("data-odds", `"${awayTeamH2hVar.price}"`);
      awayTeamMLButton.setAttribute("data-wagered", "20");
      awayTeamMLButton.setAttribute(
        "data-game-teams",
        `${awayTeamH2hVar.name} @ ${homeTeamH2hVar.name}`
      );
      awayTeamMLButton.setAttribute(
        "data-game-date",
        ` ${formattedDateString}`
      );
      awayTeamMLButton.addEventListener("click", function () {
        console.log("game Link", this.getAttribute("data-game-link"));
        const userId = this.getAttribute("data-user-id");
        const betName = this.getAttribute("data-bet-name");
        const odds = this.getAttribute("data-odds");
        const wagered = this.getAttribute("data-wagered");
        const gameTeams = this.getAttribute("data-game-teams");
        const gameDate = this.getAttribute("data-game-date");
        //addData(userId, betName, odds, wagered);
        const cartLen = appendGameDataToBetCart(
          userId,
          betName,
          odds,
          gameTeams,
          gameDate
        );
        itemsInCart.textContent = cartLen;
      });

      const awayTeamMLOdds = document.createElement("div");
      awayTeamMLOdds.classList.add("awayTeamMLOdds");
      awayTeamMLOdds.textContent = awayTeamH2hVar.price;

      awayTeamMLButton.appendChild(awayTeamMLOdds);

      awayMoneyContainer.appendChild(awayTeamMLButton);

      awayTeamSpreadButtonContainer.appendChild(awayTeamSpreadButton);

      parentAwayContainer.appendChild(awayTeam);
      parentAwayContainer.appendChild(awayTeamSpreadButtonContainer);
      parentAwayContainer.appendChild(awayTeamOUButtonContainer);

      parentAwayContainer.appendChild(awayMoneyContainer);
      //Home team div
      const parentHomeContainer = document.createElement("div");
      parentHomeContainer.classList.add("parentHomeContainer");

      const homeheaderLeft = document.createElement("div");
      homeheaderLeft.classList.add("homeheaderLeft");

      const hometeamIcon = document.createElement("div");
      hometeamIcon.classList.add("hometeamIcon");

      const homeTeamImg = document.createElement("img");
      homeTeamImg.classList.add("homeTeamIconSize"); // Add this class

      const homeTeamNamelogo = homeTeamH2hVar.name; // Example: "Cleveland Cavaliers"

      const homeFormattedTeamName = homeTeamNamelogo
        .toLowerCase()
        .replace(/ /g, "-");

      // Construct the file name
      const homeLogoFileName = `nba-${homeFormattedTeamName}-logo.png`;
      console.log(homeFormattedTeamName);
      // Full path to the logo
      const homeLogoFilePath = `${logoFolderPath}${homeLogoFileName}`;

      homeTeamImg.src = homeLogoFilePath;
      homeTeamImg.alt = ""; // Add the alt attribute to match

      hometeamIcon.appendChild(homeTeamImg);
      homeheaderLeft.appendChild(hometeamIcon);
      const homeTeamFont = document.createElement("div");
      homeTeamFont.classList.add("homeTeamFont");

      const homeTeamName = document.createElement("div");
      homeTeamName.style.fontWeight = "bold";
      homeTeamName.textContent = homeTeamSpreadVar.name;

      const homeTeamStats = document.createElement("div");
      homeTeamStats.textContent = "8-4, 6th Western";

      homeTeamFont.appendChild(homeTeamName);
      homeTeamFont.appendChild(homeTeamStats);
      homeheaderLeft.appendChild(homeTeamFont);
      parentHomeContainer.appendChild(homeheaderLeft);

      const homeSpreadContainer = document.createElement("div");
      homeSpreadContainer.classList.add("homeSpreadContainer");

      const hometeamSpreadButton = document.createElement("button");
      hometeamSpreadButton.classList.add("homeTeamSpreadButton", "add");

      hometeamSpreadButton.setAttribute("data-user-id", "markamiri1");
      hometeamSpreadButton.setAttribute(
        "data-bet-name",
        `"[${homeTeamSpreadVar.name} spread ${homeTeamSpreadVar.point} unsettled]"`
      );
      hometeamSpreadButton.setAttribute(
        "data-odds",
        `"${homeTeamSpreadVar.price}"`
      );
      hometeamSpreadButton.setAttribute(
        "data-game-teams",
        `${awayTeamSpreadVar.name} @ ${homeTeamSpreadVar.name}`
      );
      hometeamSpreadButton.setAttribute(
        "data-game-date",
        ` ${formattedDateString}`
      );

      hometeamSpreadButton.setAttribute("data-wagered", "20");
      hometeamSpreadButton.addEventListener("click", function () {
        console.log("game Link", this.getAttribute("data-game-link"));
        const userId = this.getAttribute("data-user-id");
        const betName = this.getAttribute("data-bet-name");
        const odds = this.getAttribute("data-odds");
        const wagered = this.getAttribute("data-wagered");
        const gameTeams = this.getAttribute("data-game-teams");
        const gameDate = this.getAttribute("data-game-date");
        //addData(userId, betName, odds, wagered);
        const cartLen = appendGameDataToBetCart(
          userId,
          betName,
          odds,
          gameTeams,
          gameDate
        ); // Call AddData function

        itemsInCart.textContent = cartLen;
        /*
        if (cartLen > 1) {
          straightButton.classList.remove("active");
          parlayButton.classList.add("active");
          toggleInputVisibility(true);
        } else if (cartLen === 1) {
          parlayButton.classList.remove("active");
          straightButton.classList.add("active");
          toggleInputVisibility(false);
        }
        */
      });

      const homeTeamSpreadLine = document.createElement("div");
      homeTeamSpreadLine.classList.add("homeTeamSpreadLine");
      homeTeamSpreadLine.textContent = homeTeamSpreadVar.point;

      const homeTeamSpreadOdds = document.createElement("div");
      homeTeamSpreadOdds.classList.add("homeTeamSpreadOdds");
      homeTeamSpreadOdds.textContent = homeTeamSpreadVar.price;

      hometeamSpreadButton.appendChild(homeTeamSpreadLine);
      hometeamSpreadButton.appendChild(homeTeamSpreadOdds);
      homeSpreadContainer.appendChild(hometeamSpreadButton);
      parentHomeContainer.append(homeSpreadContainer);

      const homeOUContainer = document.createElement("div");
      homeOUContainer.classList.add("homeOUContainer");

      const homeTeamOUButton = document.createElement("button");
      homeTeamOUButton.classList.add("homeTeamOUButton", "add");

      homeTeamOUButton.setAttribute("data-user-id", "markamiri1");
      homeTeamOUButton.setAttribute(
        "data-bet-name",
        `"[${awayTeamH2hVar.name} ${homeTeamTotalVar.name} ${homeTeamTotalVar.point} unsettled]"`
      );
      homeTeamOUButton.setAttribute("data-odds", `"${homeTeamTotalVar.price}"`);
      homeTeamOUButton.setAttribute("data-wagered", "20");
      homeTeamOUButton.setAttribute(
        "data-game-teams",
        `${awayTeamH2hVar.name} @ ${homeTeamH2hVar.name}`
      );
      homeTeamOUButton.setAttribute(
        "data-game-date",
        ` ${formattedDateString}`
      );
      homeTeamOUButton.addEventListener("click", function () {
        console.log("game Link", this.getAttribute("data-game-link"));
        const userId = this.getAttribute("data-user-id");
        const betName = this.getAttribute("data-bet-name");
        const odds = this.getAttribute("data-odds");
        const wagered = this.getAttribute("data-wagered");
        const gameTeams = this.getAttribute("data-game-teams");
        const gameDate = this.getAttribute("data-game-date");
        //addData(userId, betName, odds, wagered);
        const cartLen = appendGameDataToBetCart(
          userId,
          betName,
          odds,
          gameTeams,
          gameDate
        );
        itemsInCart.textContent = cartLen;
      });

      const homeTeamOULine = document.createElement("div");
      homeTeamOULine.classList.add("homeTeamOULine");
      homeTeamOULine.textContent =
        homeTeamTotalVar.name + " " + homeTeamTotalVar.point;

      const homeTeamOUodds = document.createElement("div");
      homeTeamOUodds.classList.add("homeTeamOUodds");
      homeTeamOUodds.textContent = homeTeamTotalVar.price;
      homeTeamOUButton.appendChild(homeTeamOULine);
      homeTeamOUButton.appendChild(homeTeamOUodds);
      homeOUContainer.appendChild(homeTeamOUButton);
      parentHomeContainer.appendChild(homeOUContainer);

      const homeMoneyContainer = document.createElement("div");
      homeMoneyContainer.classList.add("homeMoneyContainer");

      const homeTeamMLButton = document.createElement("button");
      homeTeamMLButton.classList.add("homeTeamMLButton", "add");

      homeTeamMLButton.setAttribute("data-user-id", "markamiri1");
      homeTeamMLButton.setAttribute(
        "data-bet-name",
        `"[${homeTeamH2hVar.name} MoneyLine unsettled]"`
      );
      homeTeamMLButton.setAttribute("data-odds", `"${homeTeamH2hVar.price}"`);
      homeTeamMLButton.setAttribute("data-wagered", "20");
      homeTeamMLButton.setAttribute(
        "data-game-teams",
        `${awayTeamH2hVar.name} @ ${homeTeamH2hVar.name}`
      );
      homeTeamMLButton.setAttribute(
        "data-game-date",
        ` ${formattedDateString}`
      );
      homeTeamMLButton.addEventListener("click", function () {
        console.log("game Link", this.getAttribute("data-game-link"));
        const userId = this.getAttribute("data-user-id");
        const betName = this.getAttribute("data-bet-name");
        const odds = this.getAttribute("data-odds");
        const wagered = this.getAttribute("data-wagered");
        const gameTeams = this.getAttribute("data-game-teams");
        const gameDate = this.getAttribute("data-game-date");
        //addData(userId, betName, odds, wagered);
        const cartLen = appendGameDataToBetCart(
          userId,
          betName,
          odds,
          gameTeams,
          gameDate
        );
        itemsInCart.textContent = cartLen;
      });

      const homeTeamMLodds = document.createElement("div");
      homeTeamMLodds.classList.add("homeTeamMLodds");
      homeTeamMLodds.textContent = homeTeamH2hVar.price;
      homeTeamMLButton.appendChild(homeTeamMLodds);
      homeMoneyContainer.appendChild(homeTeamMLButton);
      parentHomeContainer.appendChild(homeMoneyContainer);

      gameWrapper.appendChild(parentAwayContainer);
      gameWrapper.appendChild(parentHomeContainer);
      gameWrapper.appendChild(homeTeamDiv);
      gameWrapper.appendChild(awayTeamDiv);
      //Ended off here working on the away team container

      // Append H2H market
      /*
      const h2hDiv = document.createElement("div");
      h2hDiv.classList.add("h2h");
      h2hDiv.textContent = `H2H: ${h2h.outcomes
        .map((outcome) => `${outcome.name}: ${outcome.price}`)
        .join(", ")}`;
      gameWrapper.appendChild(h2hDiv);

      // Append Spreads market
      const spreadsDiv = document.createElement("div");
      spreadsDiv.classList.add("spreads");

      spreadsDiv.textContent = `Spreads: ${spreads.outcomes
        .map(
          (outcome) => `${outcome.name} (${outcome.point}): ${outcome.price}`
        )
        .join(", ")}`;
      gameWrapper.appendChild(spreadsDiv);

      // Append Totals market

      const totalsDiv = document.createElement("div");
      totalsDiv.classList.add("totals");
      totalsDiv.textContent = `Totals: ${totals.outcomes
        .map(
          (outcome) => `${outcome.name} (${outcome.point}): ${outcome.price}`
        )
        .join(", ")}`;
      gameWrapper.appendChild(totalsDiv);

      // Append the game wrapper to the container
      */
      gameSchedule.appendChild(gameWrapper);
    }
  });
}

// Function to fetch data from the API
async function fetchNBAData() {
  const options = {
    method: "GET",
    url: "https://odds.p.rapidapi.com/v4/sports/basketball_nba/odds",
    params: {
      regions: "us",
      oddsFormat: "decimal",
      markets: "h2h,spreads,totals",
    },
    headers: {
      "x-rapidapi-key": "c90a3cc54fmsh5fa28b05ff28b82p15b212jsn2308fcc24e55",
      "x-rapidapi-host": "odds.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const allGameData = response.data;

    // Append each game's data to the DOM
    appendGameDataToDOM(allGameData);
  } catch (error) {
    console.error(error);
  }
}

async function fetchOdds() {
  const options = {
    method: "GET",
    url: "https://odds.p.rapidapi.com/v4/sports/basketball_nba/odds",
    params: {
      regions: "us",
      oddsFormat: "decimal",
      markets: "h2h,spreads,totals",
    },
    headers: {
      "x-rapidapi-key": "c90a3cc54fmsh5fa28b05ff28b82p15b212jsn2308fcc24e55",
      "x-rapidapi-host": "odds.p.rapidapi.com",
    },
  };
  try {
    // Make the API request
    const response = await axios.request(options);

    // Save the response data to a variable
    const apiData = response.data;

    // Log the data
    console.log("API Data:", apiData);

    // Return the data if needed
    return apiData;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchTempNBAData() {
  try {
    // Fetch the JSON data from the file
    const response = await fetch("testingFolder/testingCasinoDataSet.json");

    // Check if the response is successful (status code 200)
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // Parse the response as JSON
    const allGameData = await response.json();

    // Log the data to the console
    console.log(allGameData);

    // Append each game's data to the DOM
    appendGameDataToDOM(allGameData);
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

export {
  appendGameDataToDOM,
  filterGameData,
  fetchNBAData,
  fetchOdds,
  fetchTempNBAData,
};

// Fetch the NBA data
//fetchNBAData();
