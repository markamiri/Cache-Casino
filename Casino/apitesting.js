const API_KEY = "743ecb6572msh7921b757954e5b6p17850cjsn40bf0515f96d";
const BASE_URL = "https://api.the-odds-api.com";

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

// Function to dynamically create and append game data elements
function appendGameDataToDOM(gameData) {
  const container = document.getElementById("container");

  gameData.forEach((game) => {
    const { commence_time, away_team, home_team, h2h, spreads, totals } =
      filterGameData(game);

    // Proceed only if all markets are available
    if (h2h && spreads && totals) {
      // Create a wrapper div for each game

      const homeTeamH2hVar = h2h.outcomes[0];
      const awayTeamH2hVar = h2h.outcomes[1];

      console.log(
        `Home Team h2h ${homeTeamH2hVar.name},  ${homeTeamH2hVar.price}`
      );
      console.log(
        `Away Team h2h ${awayTeamH2hVar.name},  ${awayTeamH2hVar.price}`
      );

      const homeTeamSpreadVar = spreads.outcomes[0];
      const awayTeamSpreadVar = spreads.outcomes[1];

      console.log(
        `Home Team spread ${homeTeamSpreadVar.name}, ${homeTeamSpreadVar.point}, ${homeTeamSpreadVar.price}`
      );
      console.log(
        `Away Team spread ${awayTeamSpreadVar.name}, ${awayTeamSpreadVar.point}, ${awayTeamSpreadVar.price}`
      );

      const homeTeamTotalVar = totals.outcomes[0];
      const awayTeamTotalVar = totals.outcomes[1];

      console.log(
        `Home Team total ${homeTeamTotalVar.name}, ${homeTeamTotalVar.point}, ${homeTeamTotalVar.price}`
      );
      console.log(
        `Away Team total ${awayTeamTotalVar.name}, ${awayTeamTotalVar.point}, ${awayTeamTotalVar.price}`
      );

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
      commenceTimeDiv.textContent = ` ${commenceDate.toLocaleString()}`;

      awayheaderLeft.appendChild(commenceTimeDiv);

      const gameWrapper = document.createElement("div");
      gameWrapper.classList.add("container");

      // Create individual divs for each data field
      const homeTeamDiv = document.createElement("div");
      homeTeamDiv.classList.add("homeTeam");
      homeTeamDiv.textContent = `Home Team: ${home_team}`;

      const awayTeamDiv = document.createElement("div");
      awayTeamDiv.classList.add("awayTeam");
      awayTeamDiv.textContent = `Away Team: ${away_team}`;

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
      awayTeamImg.src = "team_Logo/nba-memphis-grizzlies-logo.png";
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
        `[${awayTeamSpreadVar.name} spread ${awayTeamSpreadVar.point}]`
      );
      awayTeamSpreadButton.setAttribute(
        "data-odds",
        `[${awayTeamSpreadVar.price}]`
      );
      awayTeamSpreadButton.setAttribute("data-wagered", "20");

      awayTeamSpreadButton.addEventListener("click", function () {
        // Log all attributes of the button
        console.log("Button attributes:");
        console.log("user-id:", this.getAttribute("data-user-id"));
        console.log("bet-name:", this.getAttribute("data-bet-name"));
        console.log("odds:", this.getAttribute("data-odds"));
        console.log("wagered:", this.getAttribute("data-wagered"));
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
      awayTeamOUButton.classList.add("awayTeamOUButton");

      const awayTeamOULine = document.createElement("div");
      awayTeamOULine.classList.add("awayTeamOULine");
      awayTeamOULine.textContent = awayTeamTotalVar.point;

      const awayTeamOULineOdds = document.createElement("div");
      awayTeamOULineOdds.classList.add("awayTeamOULineOdds");
      awayTeamOULineOdds.textContent = awayTeamTotalVar.price;

      awayTeamOUButton.appendChild(awayTeamOULine);
      awayTeamOUButton.appendChild(awayTeamOULineOdds);

      awayTeamOUButtonContainer.appendChild(awayTeamOUButton);

      const awayMoneyContainer = document.createElement("div");
      awayMoneyContainer.classList.add("awayMoneyContainer");

      const awayTeamMLButton = document.createElement("button");
      awayTeamMLButton.classList.add("awayTeamMLButton");

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

      const hometeamImg = document.createElement("img");
      hometeamImg.classList.add("homeTeamIconSize"); // Add this class
      hometeamImg.src = "team_Logo/nba-los-angeles-lakers-logo.png";
      hometeamImg.alt = ""; // Add the alt attribute to match

      hometeamIcon.appendChild(hometeamImg);
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
      hometeamSpreadButton.classList.add("homeTeamSpreadButton");

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
      homeTeamOUButton.classList.add("homeTeamOUButton");

      const homeTeamOULine = document.createElement("div");
      homeTeamOULine.classList.add("homeTeamOULine");
      homeTeamOULine.textContent = homeTeamTotalVar.point;

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
      homeTeamMLButton.classList.add("homeTeamMLButton");

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
      container.appendChild(gameWrapper);
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
export { appendGameDataToDOM, filterGameData, fetchNBAData };

// Fetch the NBA data
//fetchNBAData();
