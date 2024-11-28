export const filterGameDetails = (games) => {
  return games.map((game) => {
    // Extract necessary details
    const homeTeam = game.teams.home.name;
    const visitorTeam = game.teams.visitors.name;
    const homePoints = game.scores.home.points || 0; // Default to 0 if no points are recorded
    const visitorPoints = game.scores.visitors.points || 0;
    const totalPoints = visitorPoints + homePoints;
    const winningTeam = visitorPoints > homePoints ? "visitor ML" : "home ML";

    // Return the filtered object
    return {
      homeTeam,
      visitorTeam,
      homePoints,
      visitorPoints,
      totalPoints,
      winningTeam,
    };
  });
};

export const fetchGamesByDate = async () => {
  // Get today's date in the required format (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0]; // Example: "2024-11-27"

  const options = {
    method: "GET",
    url: "https://api-nba-v1.p.rapidapi.com/games", // Correct endpoint for games
    params: { date: today }, // Include today's date as a parameter
    headers: {
      "x-rapidapi-key": "c90a3cc54fmsh5fa28b05ff28b82p15b212jsn2308fcc24e55",
      "x-rapidapi-host": "api-nba-v1.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const games = response.data.response;
    console.log("Games on today's date:", response.data);
    const filteredGames = filterGameDetails(games);
    console.log(filteredGames);
  } catch (error) {
    console.error("Error fetching games:", error.message);
  }
};

// Call the function
//fetchGamesByDate();
