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

  totalPayoutDiv.textContent = "$0.00";
  betCart.innerHTML = ""; // Clear the cart

  function calculatePayout() {
    const payout = betsCart.reduce((total, bet) => total + (bet[7] || 0), 0);
    totalPayoutDiv.textContent = `$${payout.toFixed(2)}`; // Update the payout display
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
    betLink.textContent = `Bet: ${betName}, Odds: ${odds}, Teams: ${gameTeams}, Date: ${gameDate}, item ${cartItems}`;

    const betInput = document.createElement("input");
    betInput.type = "number";
    betInput.placeholder = "Enter your wager";
    betInput.value = wager; // Set the value from the array

    const betOutput = document.createElement("input");
    betOutput.type = "number";
    betOutput.placeholder = "$0.00";
    betOutput.readOnly = true;

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

    betLink.appendChild(betInput);
    betLink.appendChild(betOutput);
    betCart.appendChild(betLink);
  });

  calculatePayout(); // Initial calculation of total payout
}

// Function to dynamically create and append game data elements
function appendGameDataToDOM(gameData) {
  const gameSchedule = document.getElementById("gameSchedule");

  gameData.forEach((game) => {
    const { commence_time, away_team, home_team, h2h, spreads, totals } =
      filterGameData(game);

    // Proceed only if all markets are available
    if (h2h && spreads && totals) {
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
        `"[${awayTeamSpreadVar.name} spread ${awayTeamSpreadVar.point}]"`
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
        `"[${awayTeamH2hVar.name} ${awayTeamTotalVar.name}  ${awayTeamTotalVar.point}]"`
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
        `"[${awayTeamH2hVar.name} MoneyLine]"`
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
        `"[${homeTeamSpreadVar.name} spread ${homeTeamSpreadVar.point}]"`
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
        `"[${awayTeamH2hVar.name} ${homeTeamTotalVar.name}  ${homeTeamTotalVar.point}]"`
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
        `"[${homeTeamH2hVar.name} MoneyLine]"`
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
