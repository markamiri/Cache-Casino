// casino-functions.js

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
  runTransaction,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjl0DH8mQxyDvtHj5XO37lHFUpv5FE61E",
  authDomain: "fir-v10-5e04f.firebaseapp.com",
  databaseURL: "https://fir-v10-5e04f-default-rtdb.firebaseio.com",
  projectId: "fir-v10-5e04f",
  storageBucket: "fir-v10-5e04f.appspot.com",
  messagingSenderId: "539121343265",
  appId: "1:539121343265:web:0972f1e127abab931efc60",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase();
const firestore = getFirestore(app);

async function getUpdateBetNames(key) {
  let betUser = "";
  const userSnapshot = await get(ref(db, `unsettled/${key}`));
  if (userSnapshot.exists()) {
    const betSlip = userSnapshot.val(); // Extract the data
    betUser = betSlip?.name; // Access the name field
  } else {
    console.log("Bet slip not found for key:", key);
  }

  console.log("the bet user name", betUser);
  console.log("Fetching the updated bet names...");
  const snapshot = await get(
    ref(db, `unsettled/${key}/betObject/bet_1/bet name`)
  );
  if (snapshot.exists()) {
    const updatedBetNames = snapshot.val(); // Fetch the updated bet names
    console.log("Updated Bet Names:", updatedBetNames);
    //parlay bet slip update

    const hasFailed = updatedBetNames.some((betName) => {
      const betWords = betName.split(" "); // Split the bet name into words
      const status = betWords.pop(); // Extract the last word (status)
      return status === "failed"; // Check if the status is "failed"
    });
    const hasOnlyCache = updatedBetNames.every((betName) => {
      const betWords = betName.split(" "); // Split the bet name into words
      const status = betWords[betWords.length - 1]; // Get the last word (status)
      return status === "cache"; // Check if the status is "cache"
    });
    const hasOnlyPush = updatedBetNames.every((betName) => {
      const betWords = betName.split(" "); // Split the bet name into words
      const status = betWords[betWords.length - 1]; // Get the last word (status)
      return status === "push"; // Check if the status is "cache"
    });
    const hasCache = updatedBetNames.some((betName) => {
      const betWords = betName.split(" "); // Split the bet name into words
      const status = betWords[betWords.length - 1]; // Get the last word (status)
      return status === "cache";
    });

    const hasPush = updatedBetNames.some((betName) => {
      const betWords = betName.split(" "); // Split the bet name into words
      const status = betWords[betWords.length - 1]; // Get the last word (status)
      return status === "push";
    });
    const totalRe = 0;
    //parlay has one failed leg
    if (hasFailed) {
      console.log("There is at least one bet slip with a status of 'failed'.");
      console.log("Before unsettled update, totalRe:", totalRe);

      await update(ref(db, `unsettled/${key}`), {
        "betObject/bet_1/status": "failed",
        unsettled: "false",
        totalReturn: totalRe,
      });
      console.log("Before betslipSet update, totalRe:", totalRe);

      await update(ref(db, `betslipSet/${betUser}/betslips/${key}`), {
        unsettled: "false",
        "betObject/bet_1/status": "failed",
        totalReturn: totalRe,
      });
      await remove(ref(db, `unsettled/${key}`));
    } else {
      //parlay has all wins
      if (hasOnlyCache) {
        console.log("All bet slips have a status of 'cache'.");

        const snapshot = await get(ref(db, `unsettled/${key}`));
        if (snapshot.exists()) {
          const updatedData = snapshot.val(); // Fetch the updated data
          const odds = updatedData.betObject?.bet_1?.odds || [];
          const amtwagered = updatedData.amtwagered;
          const betUser = updatedData.name;
          console.log("amtwagered", amtwagered);
          console.log("Odds:", odds);

          const totalOdds = odds.reduce((acc, odd) => acc * parseFloat(odd), 1);
          const roundedTotalOdds = totalOdds.toFixed(2);
          const totalRe = (roundedTotalOdds * amtwagered).toFixed(2);
          console.log(totalRe);

          const userBalanceRef = ref(db, `betslipSet/${betUser}/balance`);
          let currentBalance = 0;

          try {
            const snapshot = await get(userBalanceRef); // Fetch the data at this reference
            if (snapshot.exists()) {
              currentBalance = snapshot.val();
            } else {
              console.log("No data found at userBalanceRef.");
            }
          } catch (error) {
            console.error("Error fetching values:", error);
          }
          console.log("new curr balance", currentBalance);
          let newBalance = parseFloat(currentBalance) + parseFloat(totalRe);

          await update(ref(db, `unsettled/${key}`), {
            "betObject/bet_1/status": "cache",
            unsettled: "false",
            totalReturn: totalRe,
          });

          await update(ref(db, `betslipSet/${betUser}/betslips/${key}`), {
            unsettled: "false",
            totalReturn: totalRe,
            "betObject/bet_1/status": "cache",
          });

          await set(ref(db, `betslipSet/${betUser}/balance`), newBalance);
        } else {
          console.log("No data found for the key:", key);
        }
        await remove(ref(db, `unsettled/${key}`));
      }
      if (hasCache && hasPush) {
        console.log("The array contains both 'cache' and 'push'.");
        const betsnapshot = await get(ref(db, `unsettled/${key}`));
        const betSlipData = betsnapshot.val(); // Fetch the updated data
        const amtwagered = betSlipData.amtwagered;
        const betUser = betSlipData.name;
        console.log("amtwagered", amtwagered);
        console.log("betUser:", betUser);

        const snapshot = await get(
          ref(db, `unsettled/${key}/betObject/bet_1/bet name`)
        );
        const updatedBetNames = snapshot.val(); // Fetch the updated bet names

        let newOdds = 0;
        // Fetch the odds from the database
        const snapshotOdds = await get(
          ref(db, `unsettled/${key}/betObject/bet_1/odds`)
        );
        if (snapshotOdds.exists()) {
          const oddsArray = snapshotOdds.val(); // Extract odds array
          console.log("Odds Array:", oddsArray);

          // Get the indexes with "push" status
          const indexesWithPush = updatedBetNames
            .map((betName, index) => {
              const betWords = betName.split(" "); // Split the bet name into words
              const status = betWords[betWords.length - 1]; // Get the last word (status)
              return status === "push" ? index : -1; // Return the index if "push", otherwise -1
            })
            .filter((index) => index !== -1); // Filter out -1 values

          console.log("Indexes with 'push':", indexesWithPush);

          // Filter the odds to exclude those at "push" indexes
          const oddsWithoutPush = oddsArray.filter(
            (_, index) => !indexesWithPush.includes(index)
          );
          console.log("Odds without 'push':", oddsWithoutPush);

          // Multiply the odds without "push"
          const productOfOdds = oddsWithoutPush
            .reduce((acc, odd) => acc * parseFloat(odd), 1)
            .toFixed(2);
          console.log("Product of Odds without 'push':", productOfOdds);
          newOdds = productOfOdds;
        } else {
          console.log("No odds found in the database.");
        }

        // getting the balance
        const userBalanceRef = ref(db, `betslipSet/${betUser}/balance`);
        let currentBalance = 0;

        try {
          const snapshot = await get(userBalanceRef); // Fetch the data at this reference
          if (snapshot.exists()) {
            currentBalance = snapshot.val();
          } else {
            console.log("No data found at userBalanceRef.");
          }
        } catch (error) {
          console.error("Error fetching values:", error);
        }
        console.log("new curr balance", currentBalance);
        const newRe = amtwagered * newOdds;
        let newBalance = parseFloat(currentBalance) + parseFloat(newRe);

        await update(ref(db, `unsettled/${key}`), {
          "betObject/bet_1/status": "cache with push",
          unsettled: "false",
          totalReturn: newRe,
        });
        await update(ref(db, `betslipSet/${betUser}/betslips/${key}`), {
          unsettled: "false",
          totalReturn: newRe,
          "betObject/bet_1/status": "cache with push",
        });
        await set(ref(db, `betslipSet/${betUser}/balance`), newBalance);
        await remove(ref(db, `unsettled/${key}`));
      } else if (hasOnlyPush) {
        console.log("All bet slips have a status of 'cache'.");

        const snapshot = await get(ref(db, `unsettled/${key}`));
        if (snapshot.exists()) {
          const updatedData = snapshot.val(); // Fetch the updated data
          const odds = updatedData.betObject?.bet_1?.odds || [];
          const amtwagered = updatedData.amtwagered;
          const betUser = updatedData.name;
          console.log("amtwagered", amtwagered);
          console.log("Odds:", odds);

          const totalOdds = 1;
          const roundedTotalOdds = totalOdds.toFixed(2);
          const totalRe = (roundedTotalOdds * amtwagered).toFixed(2);
          console.log(totalRe);

          const userBalanceRef = ref(db, `betslipSet/${betUser}/balance`);
          let currentBalance = 0;

          try {
            const snapshot = await get(userBalanceRef); // Fetch the data at this reference
            if (snapshot.exists()) {
              currentBalance = snapshot.val();
            } else {
              console.log("No data found at userBalanceRef.");
            }
          } catch (error) {
            console.error("Error fetching values:", error);
          }
          console.log("new curr balance", currentBalance);
          let newBalance = parseFloat(currentBalance) + parseFloat(totalRe);

          await update(ref(db, `unsettled/${key}`), {
            "betObject/bet_1/status": "push",
            unsettled: "false",
            totalReturn: totalRe,
          });

          await update(ref(db, `betslipSet/${betUser}/betslips/${key}`), {
            unsettled: "false",
            totalReturn: totalRe,
            "betObject/bet_1/status": "push",
          });

          await set(ref(db, `betslipSet/${betUser}/balance`), newBalance);
          await remove(ref(db, `unsettled/${key}`));
        } else {
          console.log("No data found for the key:", key);
        }
      } else {
        console.log("The array does not contain both 'cache' and 'push'.");
      }
      // now we need to do it for push
      // continue
    }
    /*
    for (const [index, betName] of updatedBetNames.entries()) {
      console.log(`Bet Name ${index}:`, betName);
      const betWords = betName.split(" ");
      const status = betName.pop();
      console.log("status: ", status);
    }
    */
  } else {
    console.log("No bet names found in the database.");
  }
}

export async function getUnsettled() {
  const unsettledRef = ref(db, "unsettled/");
  try {
    const snapshot = await get(unsettledRef);
    if (snapshot.exists()) {
      const unsettledData = snapshot.val();

      const fetchGameResults = async () => {
        try {
          const response = await fetch("testingFolder/gameResults.json");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const gameResults = await response.json(); // Store the fetched data in a variable
          console.log("Game Results:", gameResults); // Log the data
          return gameResults; // Return the data for further use
        } catch (error) {
          console.error("Error fetching the JSON file:", error);
          return null;
        }
      };

      const gameResults = await fetchGameResults(); // Call the function and store the data

      // Loop through each bet slip in unsettledData
      for (const key in unsettledData) {
        if (unsettledData.hasOwnProperty(key)) {
          const betSlip = unsettledData[key]; // Individual bet slip object
          console.log(`Bet Slip ID: ${key}`);

          const betNames = betSlip.betObject?.bet_1?.["bet name"]?.[0]; // Access the nested array
          const betUser = betSlip.name;
          const betWager = betSlip.amtwagered;
          let totalbetodds = betSlip.betObject.bet_1?.["odds"];
          if (Array.isArray(totalbetodds)) {
            totalbetodds = totalbetodds
              .reduce((acc, val) => acc * parseFloat(val), 1)
              .toFixed(2); // Multiply all values and round to 2 decimals
            console.log("Updated Total Bet Odds:", totalbetodds);
          } else {
            console.error("Invalid odds array:", totalbetodds);
          }
          console.log(totalbetodds);
          const userBalanceRef = ref(db, `betslipSet/${betUser}/balance`);
          let currentBalance = 0;
          try {
            const snapshot = await get(userBalanceRef); // Fetch the data at this reference
            if (snapshot.exists()) {
              console.log("Values at userBalanceRef:", snapshot.val()); // Print the values
              currentBalance = snapshot.val();
            } else {
              console.log("No data found at userBalanceRef.");
            }
          } catch (error) {
            console.error("Error fetching values:", error);
          }
          const totalre = (betWager * totalbetodds).toFixed(2);
          console.log("totalre ", totalre);
          console.log("curr balance ", currentBalance);
          const potentialReturn = (
            parseFloat(currentBalance) + parseFloat(totalre)
          ).toFixed(2);
          const pushReturnBalance = (
            parseFloat(currentBalance) + parseFloat(betWager)
          ).toFixed(2);
          console.log("potentialReturn ", potentialReturn);
          console.log("Type of betNames:", typeof betNames);
          console.log("Value of betNames:", betNames);
          if (Array.isArray(betNames)) {
            //Parlay update bet slips
            console.log("is this working?>");
            for (const [index, betName] of betNames.entries()) {
              console.log(`Bet Name ${index}:`, betName); // Adding 1 to index for 1-based numbering
              //split the bet name into words
              const betWords = betName.split(" ");
              // check if the last word is moneyline
              const lastIndex = betWords[betWords.length - 2];
              if (lastIndex === "MoneyLine") {
                let status = betWords.pop();
                console.log("testing status", status);
                const removedWord = betWords.pop();
                console.log("removed word", removedWord);
                const teamName = betWords.join(" ");
                console.log("team Name", teamName);

                // find the game log with the team in the bet slip

                const matchingIndex = gameResults.findIndex(
                  (game) =>
                    game.homeTeam === teamName || game.visitorTeam === teamName
                );
                if (matchingIndex !== -1) {
                  const matchingGame = gameResults[matchingIndex];
                  console.log("Matching Game logs:", matchingGame);

                  //check if its the visitor team
                  if (matchingGame.visitorTeam === teamName) {
                    console.log(`${teamName} is the away team`);
                    const winningTeam = matchingGame.winningTeam;
                    const winningTeamVar = winningTeam.split(" ")[0];
                    // if the user bet visitor team ML and they won
                    if (winningTeamVar === "visitor") {
                      // update the betslip in unsettled first
                      console.log("bet cashed");

                      status = "cache";
                      const newBetName =
                        teamName + " " + removedWord + " " + status;
                      console.log(newBetName);

                      await update(ref(db, `unsettled/${key}`), {
                        [`betObject/bet_1/bet name/${index}`]: newBetName,
                        "betObject/bet_1/status": "cashed",
                        unsettled: "false",
                      });
                      // update the betslip in the users folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          totalReturn: totalre,
                          "betObject/bet_1/status": "cashed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        }
                      );

                      /*
                      //update the users balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );
                      //remove betslip from the unsettled folder
                      await remove(ref(db, `unsettled/${key}`));
                      */
                    }
                    // if the user bet visitor team ML and they lost
                    else {
                      console.log("bet failed");
                      //update bet in the unsettled folder
                      status = "failed";
                      const newBetName =
                        teamName + " " + removedWord + " " + status;
                      console.log(newBetName);
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                        [`betObject/bet_1/bet name/${index}`]: newBetName,
                      });
                      // update in the user folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        }
                      );
                      //await remove(ref(db, `unsettled/${key}`));
                    }
                  } else if (matchingGame.homeTeam === teamName) {
                    console.log(`${teamName} is the home team`);
                    const winningTeam = matchingGame.winningTeam;
                    const winningTeamVar = winningTeam.split(" ")[0];
                    if (winningTeamVar === "home") {
                      console.log("bet cashed");
                      status = "cache";
                      const newBetName =
                        teamName + " " + removedWord + " " + status;
                      console.log(newBetName);

                      // update the betslip in unsettled first

                      await update(ref(db, `unsettled/${key}`), {
                        "betObject/bet_1/status": "cashed",
                        unsettled: "false",
                        [`betObject/bet_1/bet name/${index}`]: newBetName,
                      });

                      // update the betslip in the users folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          totalReturn: totalre,
                          "betObject/bet_1/status": "cashed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        }
                      );
                      /*
                      //update the users balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );
                      //remove betslip from the unsettled folder
                      await remove(ref(db, `unsettled/${key}`));
                      */
                    } else {
                      console.log("bet failed");
                      //update bet in the unsettled folder
                      status = "failed";
                      const newBetName =
                        teamName + " " + removedWord + " " + status;
                      console.log(newBetName);
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                        [`betObject/bet_1/bet name/${index}`]: newBetName,
                      });
                      // update in the user folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        }
                      );
                      //await remove(ref(db, `unsettled/${key}`));
                    }
                  }
                }
              } else {
                //work on spread first
                console.log("Bet Words Array:", betWords); // Log the array
                let status = betWords.pop();
                console.log("testing status", status);
                const numberLine = betWords.pop();
                console.log("number for total/spread:", numberLine);
                const prop = betWords.pop();
                const removedWord = prop;
                console.log("type of prop:", prop);
                const teamName = betWords.join(" ");
                console.log("team Name", teamName);

                if (prop === "spread") {
                  // find the game log with the team in the bet slip

                  const matchingIndex = gameResults.findIndex(
                    (game) =>
                      game.homeTeam === teamName ||
                      game.visitorTeam === teamName
                  );
                  if (matchingIndex !== -1) {
                    const matchingGame = gameResults[matchingIndex];
                    console.log("Matching Game logs:", matchingGame);
                    if (matchingGame.visitorTeam === teamName) {
                      console.log(`${teamName} is the Visitor Team`);
                      const visitorPoints = matchingGame.visitorPoints; // Access visitor points
                      const homePoints = matchingGame.homePoints; // Access home points
                      const lineInt = parseInt(numberLine, 10);
                      const newvisitorPoints = lineInt + visitorPoints;
                      console.log("new visitor points", newvisitorPoints);
                      console.log("home pts", homePoints);
                      if (newvisitorPoints > homePoints) {
                        console.log("bet cashed ");
                        status = "cache";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);

                        await update(ref(db, `unsettled/${key}`), {
                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread cash worked Nice job ");
                        */
                      } else if (newvisitorPoints < homePoints) {
                        console.log("bet failed");
                        status = "failed";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        //await remove(ref(db, `unsettled/${key}`));
                        //console.log("new spread fail worked Nice job ");
                      } else if (newvisitorPoints === homePoints) {
                        console.log("bet pushed");
                        status = "push";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        //await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new spread push worked Nice job ");
                        */
                      }
                    }
                    if (matchingGame.homeTeam === teamName) {
                      console.log(`${teamName} is the Home Team`);
                      const visitorPoints = matchingGame.visitorPoints; // Access visitor points
                      const homePoints = matchingGame.homePoints; // Access home points
                      const lineInt = parseInt(numberLine, 10);
                      const newhomePoints = lineInt + homePoints;
                      console.log("new home points", newhomePoints);
                      console.log("visitor pts", visitorPoints);
                      if (newhomePoints > visitorPoints) {
                        console.log("bet cashed ");
                        status = "cache";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        await update(ref(db, `unsettled/${key}`), {
                          [`betObject/bet_1/bet name/${index}`]: newBetName,

                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            [`betObject/bet_1/bet name/${index}`]: newBetName,

                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        /*
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread cash worked Nice job ");
                        */
                      } else if (newhomePoints < visitorPoints) {
                        console.log("bet failed");
                        status = "failed";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread fail worked Nice job ");
                        */
                      } else if (newhomePoints === visitorPoints) {
                        console.log("bet pushed");
                        status = "push";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new spread push worked Nice job ");
                        */
                      }
                    }
                  }
                } else if (prop === "Over" || prop === "Under") {
                  const matchingIndex = gameResults.findIndex(
                    (game) =>
                      game.homeTeam === teamName ||
                      game.visitorTeam === teamName
                  );
                  const matchingGame = gameResults[matchingIndex];
                  console.log("Matching Game logs:", matchingGame);
                  if (prop === "Over") {
                    if (
                      matchingGame.visitorTeam === teamName ||
                      matchingGame.homeTeam === teamName
                    ) {
                      console.log(`${teamName} is the team`);
                      const gameTotal = matchingGame.totalPoints;
                      console.log("actual game total", gameTotal);

                      const betLine = parseFloat(numberLine);
                      console.log("vegas total", betLine);
                      if (betLine < gameTotal) {
                        console.log("bet cashed");

                        status = "cache";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        // update the betslip in unsettled first
                        await update(ref(db, `unsettled/${key}`), {
                          [`betObject/bet_1/bet name/${index}`]: newBetName,

                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            [`betObject/bet_1/bet name/${index}`]: newBetName,

                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        //update the users balance
                        /*
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet cashed !");
                        */
                      } else if (betLine > gameTotal) {
                        console.log("bet failed");
                        //update bet in the unsettled folder
                        status = "failed";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet total failed worked!");
                        */
                      } else if (betLine === gameTotal) {
                        console.log("bet pushed");
                        status = "push";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new total push worked Nice job ");
                        */
                      }
                    }
                  } else if (prop === "Under") {
                    if (
                      matchingGame.visitorTeam === teamName ||
                      matchingGame.homeTeam === teamName
                    ) {
                      console.log(`${teamName} is the  team`);
                      const gameTotal = matchingGame.totalPoints;
                      console.log("actual game total", gameTotal);

                      const betLine = parseFloat(numberLine);
                      console.log("vegas total", betLine);
                      if (betLine > gameTotal) {
                        // update the betslip in unsettled first
                        console.log("bet cashed");
                        status = "cache";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        await update(ref(db, `unsettled/${key}`), {
                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            [`betObject/bet_1/bet name/${index}`]: newBetName,

                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        /*
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet cashed !");
                        */
                      } else if (betLine < gameTotal) {
                        console.log("bet failed");
                        status = "failed";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet total failed worked!");
                      } else if (betLine === gameTotal) {
                        console.log("bet pushed");
                        status = "push";
                        const newBetName =
                          teamName + " " + removedWord + " " + status;
                        console.log(newBetName);
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                          [`betObject/bet_1/bet name/${index}`]: newBetName,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                            [`betObject/bet_1/bet name/${index}`]: newBetName,
                          }
                        );
                        /*
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new total push worked Nice job ");
                        */
                      }
                    }
                  }
                }
              }
            }
            //update user parlay balance

            console.log("testing the update balance section");
            getUpdateBetNames(key);
          } else {
            const betName = betSlip.betObject?.bet_1?.["bet name"]?.[0]; // Extract bet name[0]

            //get user balance var

            //new implemented code to work for team names with 3 words
            if (betName) {
              console.log("is this being called?");
              console.log(`Bet Name[0]: ${betName}`);
              //split the bet name into words
              const betWords = betName.split(" ");
              // check if the last word is moneyline
              const lastIndex = betWords[betWords.length - 2];
              if (lastIndex === "MoneyLine") {
                let status = betWords.pop();
                console.log("testing status", status);
                const removedWord = betWords.pop();
                console.log("removed word", removedWord);
                const teamName = betWords.join(" ");
                console.log("team Name", teamName);

                // find the game log with the team in the bet slip

                const matchingIndex = gameResults.findIndex(
                  (game) =>
                    game.homeTeam === teamName || game.visitorTeam === teamName
                );

                if (matchingIndex !== -1) {
                  const matchingGame = gameResults[matchingIndex];
                  console.log("Matching Game logs:", matchingGame);

                  //check if its the visitor team
                  if (matchingGame.visitorTeam === teamName) {
                    console.log(`${teamName} is the away team`);
                    const winningTeam = matchingGame.winningTeam;
                    const winningTeamVar = winningTeam.split(" ")[0];
                    // if the user bet visitor team ML and they won
                    if (winningTeamVar === "visitor") {
                      // update the betslip in unsettled first
                      console.log("bet cashed");

                      status = "cache";
                      const newBetName =
                        teamName + " " + removedWord + " " + status;
                      console.log(newBetName);

                      await update(ref(db, `unsettled/${key}`), {
                        "betObject/bet_1/bet name/0": newBetName,
                        "betObject/bet_1/status": "cashed",
                        unsettled: "false",
                      });
                      // update the betslip in the users folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          totalReturn: totalre,
                          "betObject/bet_1/status": "cashed",
                          "betObject/bet_1/bet name/0": newBetName,
                        }
                      );
                      //update the users balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );
                      //remove betslip from the unsettled folder
                      await remove(ref(db, `unsettled/${key}`));
                    }
                    // if the user bet visitor team ML and they lost
                    else {
                      console.log("bet failed");
                      //update bet in the unsettled folder
                      status = "failed";
                      const newBetName =
                        teamName + " " + removedWord + " " + status;
                      console.log(newBetName);
                      await update(ref(db, `unsettled/${key}`), {
                        "betObject/bet_1/bet name/0": newBetName,
                        unsettled: "false",
                      });
                      // update in the user folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                          "betObject/bet_1/bet name/0": newBetName,
                        }
                      );
                      await remove(ref(db, `unsettled/${key}`));
                    }
                  } else if (matchingGame.homeTeam === teamName) {
                    console.log(`${teamName} is the home team`);
                    const winningTeam = matchingGame.winningTeam;
                    const winningTeamVar = winningTeam.split(" ")[0];
                    if (winningTeamVar === "home") {
                      console.log("bet cashed");
                      // update the betslip in unsettled first

                      await update(ref(db, `unsettled/${key}`), {
                        "betObject/bet_1/status": "cashed",
                        unsettled: "false",
                      });

                      // update the betslip in the users folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          totalReturn: totalre,
                          "betObject/bet_1/status": "cashed",
                        }
                      );
                      //update the users balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );
                      //remove betslip from the unsettled folder
                      await remove(ref(db, `unsettled/${key}`));
                    } else {
                      console.log("bet failed");
                      //update bet in the unsettled folder
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                        "betObject/bet_1/status": "failed",
                      });
                      // update in the user folder
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                        }
                      );
                      await remove(ref(db, `unsettled/${key}`));
                    }
                  }
                }
              }
              // Determined that the bet is either total or spread
              else {
                //work on spread first
                console.log("Bet Words Array:", betWords); // Log the array
                const status = betWords.pop();
                console.log("testing status", status);
                const numberLine = betWords.pop();
                console.log("number for total/spread:", numberLine);
                const prop = betWords.pop();
                console.log("type of prop:", prop);
                const teamName = betWords.join(" ");
                console.log("team Name", teamName);

                if (prop === "spread") {
                  // find the game log with the team in the bet slip

                  const matchingIndex = gameResults.findIndex(
                    (game) =>
                      game.homeTeam === teamName ||
                      game.visitorTeam === teamName
                  );
                  if (matchingIndex !== -1) {
                    const matchingGame = gameResults[matchingIndex];
                    console.log("Matching Game logs:", matchingGame);
                    if (matchingGame.visitorTeam === teamName) {
                      console.log(`${teamName} is the Visitor Team`);
                      const visitorPoints = matchingGame.visitorPoints; // Access visitor points
                      const homePoints = matchingGame.homePoints; // Access home points
                      const lineInt = parseInt(numberLine, 10);
                      const newvisitorPoints = lineInt + visitorPoints;
                      console.log("new visitor points", newvisitorPoints);
                      console.log("home pts", homePoints);
                      if (newvisitorPoints > homePoints) {
                        console.log("bet cashed ");
                        await update(ref(db, `unsettled/${key}`), {
                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread cash worked Nice job ");
                      } else if (newvisitorPoints < homePoints) {
                        console.log("bet failed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                          }
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread fail worked Nice job ");
                      } else if (newvisitorPoints === homePoints) {
                        console.log("bet pushed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                          }
                        );
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        //await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new spread push worked Nice job ");
                      }
                    }
                    if (matchingGame.homeTeam === teamName) {
                      console.log(`${teamName} is the Home Team`);
                      const visitorPoints = matchingGame.visitorPoints; // Access visitor points
                      const homePoints = matchingGame.homePoints; // Access home points
                      const lineInt = parseInt(numberLine, 10);
                      const newhomePoints = lineInt + homePoints;
                      console.log("new home points", newhomePoints);
                      console.log("visitor pts", visitorPoints);
                      if (newhomePoints > visitorPoints) {
                        console.log("bet cashed ");
                        await update(ref(db, `unsettled/${key}`), {
                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread cash worked Nice job ");
                      } else if (newhomePoints < visitorPoints) {
                        console.log("bet failed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                          }
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("new spread fail worked Nice job ");
                      } else if (newhomePoints === visitorPoints) {
                        console.log("bet pushed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                          }
                        );
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new spread push worked Nice job ");
                      }
                    }
                  }
                } else if (prop === "Over" || prop === "Under") {
                  const matchingIndex = gameResults.findIndex(
                    (game) =>
                      game.homeTeam === teamName ||
                      game.visitorTeam === teamName
                  );
                  const matchingGame = gameResults[matchingIndex];
                  console.log("Matching Game logs:", matchingGame);
                  if (prop === "Over") {
                    if (
                      matchingGame.visitorTeam === teamName ||
                      matchingGame.homeTeam === teamName
                    ) {
                      console.log(`${teamName} is the team`);
                      const gameTotal = matchingGame.totalPoints;
                      console.log("actual game total", gameTotal);

                      const betLine = parseFloat(numberLine);
                      console.log("vegas total", betLine);
                      if (betLine < gameTotal) {
                        // update the betslip in unsettled first
                        await update(ref(db, `unsettled/${key}`), {
                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet cashed !");
                      } else if (betLine > gameTotal) {
                        console.log("bet failed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                          }
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet total failed worked!");
                      } else if (betLine === gameTotal) {
                        console.log("bet pushed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                          }
                        );
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new total push worked Nice job ");
                      }
                    }
                  } else if (prop === "Under") {
                    if (
                      matchingGame.visitorTeam === teamName ||
                      matchingGame.homeTeam === teamName
                    ) {
                      console.log(`${teamName} is the  team`);
                      const gameTotal = matchingGame.totalPoints;
                      console.log("actual game total", gameTotal);

                      const betLine = parseFloat(numberLine);
                      console.log("vegas total", betLine);
                      if (betLine > gameTotal) {
                        // update the betslip in unsettled first
                        console.log("bet cashed");
                        await update(ref(db, `unsettled/${key}`), {
                          "betObject/bet_1/status": "cashed",
                          unsettled: "false",
                        });
                        // update the betslip in the users folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            totalReturn: totalre,
                            "betObject/bet_1/status": "cashed",
                          }
                        );
                        //update the users balance
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          potentialReturn
                        );
                        //remove betslip from the unsettled folder
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet cashed !");
                      } else if (betLine < gameTotal) {
                        console.log("bet failed");
                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "failed",
                        });
                        // update in the user folder
                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "failed",
                          }
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log("bet total failed worked!");
                      } else if (betLine === gameTotal) {
                        console.log("bet pushed");

                        //update bet in the unsettled folder
                        await update(ref(db, `unsettled/${key}`), {
                          unsettled: "false",
                          "betObject/bet_1/status": "push",
                          totalReturn: betWager,
                        });

                        await update(
                          ref(db, `betslipSet/${betUser}/betslips/${key}`),
                          {
                            unsettled: "false",
                            "betObject/bet_1/status": "push",
                            totalReturn: betWager,
                          }
                        );
                        await set(
                          ref(db, `betslipSet/${betUser}/balance`),
                          pushReturnBalance
                          //After its been added to the user transactions, should delete from unsettled
                        );
                        await remove(ref(db, `unsettled/${key}`));
                        console.log(
                          `Key ${key} has been successfully removed from unsettled.`
                        );
                        console.log("new total push worked Nice job ");
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return unsettledData;
    } else {
      console.log("No unsettled data found.");
      return null;
    }
  } catch (error) {
    console.log("Error getting unsettled data:", error);
    throw error;
  }
}

export function AddParlayData(userId, betName, odds, wagered) {
  const wageredAmount = parseFloat(wagered);
  const userRef = ref(db, `betslipSet/${userId}`);
  const userBalanceRef = ref(db, `betslipSet/${userId}/balance`);
  const unsettledRef = ref(db, "unsettled/");

  runTransaction(userBalanceRef, (currentBalance) => {
    if (currentBalance === null) {
      // Initialize the balance if it doesn't exist
      currentBalance = 500;
    }

    if (wageredAmount > currentBalance) {
      // Return null to abort the transaction
      alert("Insufficient funds. Your current balance is: $" + currentBalance);
      return null;
    }

    // Deduct the wagered amount
    return currentBalance - wageredAmount;
  })
    .then(({ committed, snapshot }) => {
      if (!committed) {
        console.log("Transaction aborted due to insufficient funds.");
        return;
      }

      const newBalance = snapshot.val();
      console.log("User balance has been successfully updated to:", newBalance);

      const betNames =
        typeof betName === "string" ? JSON.parse(betName) : [betName];
      const oddsArray = typeof odds === "string" ? JSON.parse(odds) : [odds];

      console.log("betName", betName);
      console.log("Inner betName array:", betName[0]);
      const oddsArryData = oddsArray[0][0];
      console.log(oddsArryData[0]);

      const betOddsObj = Object.fromEntries(
        betNames.map((bet, index) => [
          `bet_${index + 1}`,
          {
            "bet name": bet,
            odds: oddsArryData,
            status: "unsettled",
          },
        ])
      );

      const betTFObj = Object.fromEntries(
        betName[0].map((bet, index) => [
          `betName0_${index + 1}`,
          {
            status: "unsettled",
          },
        ])
      );

      const totalBetOdds = oddsArray.reduce((acc, current) => acc * current, 1);

      const betData = {
        name: userId,
        betObject: betOddsObj,
        amtwagered: wageredAmount,
        unsettled: true,
        WorL: "None",
        totalReturn: 0,
        //totalbetodds: totalBetOdds,
        betTFObj: betTFObj,
      };

      // Add the bet slip to the user's folder with a unique ID
      const betSlipRef = push(ref(db, `betslipSet/${userId}/betslips`));
      const uniqueKey = betSlipRef.key;

      return set(betSlipRef, betData)
        .then(() => {
          alert("Bet added successfully. New Balance is: $" + newBalance);

          // Add the bet slip to the 'unsettled' section
          return set(ref(db, `unsettled/${uniqueKey}`), betData);
        })
        .then(() => {
          // Update Firestore balance
          const loggedInUserId = localStorage.getItem("loggedInUserId");
          const userDocRef = doc(firestore, "users", loggedInUserId);
          return updateDoc(userDocRef, { balance: newBalance });
        });
    })
    .catch((error) => {
      console.log("Error processing bet slip:", error);
    });
  // Retrieve the user's balance
}

export function AddData(userId, betName, odds, wagered) {
  const wageredAmount = parseFloat(wagered);
  const userRef = ref(db, `betslipSet/${userId}`);
  const userBalanceRef = ref(db, `betslipSet/${userId}/balance`);
  const unsettledRef = ref(db, "unsettled/");

  runTransaction(userBalanceRef, (currentBalance) => {
    if (currentBalance === null) {
      // Initialize the balance if it doesn't exist
      currentBalance = 500;
    }

    if (wageredAmount > currentBalance) {
      // Return null to abort the transaction
      alert("Insufficient funds. Your current balance is: $" + currentBalance);
      return null;
    }

    // Deduct the wagered amount
    return currentBalance - wageredAmount;
  })
    .then(({ committed, snapshot }) => {
      if (!committed) {
        console.log("Transaction aborted due to insufficient funds.");
        return;
      }

      const newBalance = snapshot.val();
      console.log("User balance has been successfully updated to:", newBalance);

      const betNames =
        typeof betName === "string" ? JSON.parse(betName) : [betName];
      const oddsArray = typeof odds === "string" ? JSON.parse(odds) : [odds];

      console.log("betName", betName);
      console.log("Inner betName array:", betName[0]);

      const betOddsObj = Object.fromEntries(
        betNames.map((bet, index) => [
          `bet_${index + 1}`,
          {
            "bet name": bet,
            odds: oddsArray[index],
            status: "unsettled",
          },
        ])
      );

      const totalBetOdds = oddsArray.reduce((acc, current) => acc * current, 1);

      const betData = {
        name: userId,
        betObject: betOddsObj,
        amtwagered: wageredAmount,
        unsettled: true,
        WorL: "None",
        totalReturn: 0,
        totalbetodds: totalBetOdds,
      };

      // Add the bet slip to the user's folder with a unique ID
      const betSlipRef = push(ref(db, `betslipSet/${userId}/betslips`));
      const uniqueKey = betSlipRef.key;

      return set(betSlipRef, betData)
        .then(() => {
          alert("Bet added successfully. New Balance is: $" + newBalance);

          // Add the bet slip to the 'unsettled' section
          return set(ref(db, `unsettled/${uniqueKey}`), betData);
        })
        .then(() => {
          // Update Firestore balance
          const loggedInUserId = localStorage.getItem("loggedInUserId");
          const userDocRef = doc(firestore, "users", loggedInUserId);
          return updateDoc(userDocRef, { balance: newBalance });
        });
    })
    .catch((error) => {
      console.log("Error processing bet slip:", error);
    });
  // Retrieve the user's balance
}
/*
export function AddData(userId, betName, odds, wagered) {
  const wageredAmount = parseFloat(wagered);
  const userRef = ref(db, `betslipSet/${userId}`);
  const userBalanceRef = ref(db, `betslipSet/${userId}/balance`);
  const nextTransactionNumRef = ref(
    db,
    `betslipSet/${userId}/nextTransactionNum`
  );
  const unsettledRef = ref(db, "unsettled/");

  let currentBalance = 500;
  let nextTransactionNumber = 1;

  // Retrieve the user's balance
  get(userBalanceRef)
    .then((balanceSnapshot) => {
      if (balanceSnapshot.exists()) {
        currentBalance = balanceSnapshot.val();
      } else {
        // Initialize the balance if it doesn't exist
        return set(userBalanceRef, currentBalance);
      }
    })
    .then(() => {
      // Retrieve the next transaction number
      return runTransaction(nextTransactionNumRef, (currentNumber) => {
        return currentNumber || 1;
      });
    })
    .then((transactionNum) => {
      const nextTransactionNumber = transactionNum;
    })
    .then(() => {
      // Check if the user has sufficient funds
      if (wageredAmount > currentBalance) {
        alert(
          "Insufficient funds. Your current balance is: $" + currentBalance
        );
        return;
      }

      const newBalance = currentBalance - wageredAmount;

      // Update the user's balance
      return set(userBalanceRef, newBalance).then(() => {
        console.log("User balance has been successfully updated.");

        const betNames =
          typeof betName === "string" ? JSON.parse(betName) : [betName];
        const oddsArray = typeof odds === "string" ? JSON.parse(odds) : [odds];

        const betOddsObj = Object.fromEntries(
          betNames.map((bet, index) => [
            `bet_${index + 1}`, // Use a safe key format
            {
              "bet name": bet, // Nested key-value for the bet name
              odds: oddsArray[index],
              status: "unsettled", // Default status
            },
          ])
        );

        const totalBetOdds = oddsArray.reduce(
          (acc, current) => acc * current,
          1
        );

        const betData = {
          name: userId,
          betObject: betOddsObj,
          amtwagered: wageredAmount,
          transactionNum: nextTransactionNumber,
          unsettled: true,
          WorL: "None",
          totalReturn: 0,
          totalbetodds: totalBetOdds,
        };

        // Add a new transaction folder named after the transaction number
        const transactionRef = ref(
          db,
          `betslipSet/${userId}/transactions/${nextTransactionNumber}`
        );

        return set(transactionRef, betData)
          .then(() => {
            alert("Bet added successfully. New Balance is: $" + newBalance);

            // Add the bet slip to the 'unsettled' section
            return push(unsettledRef, betData);
          })
          .then(() => {
            // Increment the transaction number for the next bet
            return set(nextTransactionNumRef, nextTransactionNumber + 1);
          })
          .then(() => {
            // Update Firestore balance
            const loggedInUserId = localStorage.getItem("loggedInUserId");
            const userDocRef = doc(firestore, "users", loggedInUserId);
            return updateDoc(userDocRef, { balance: newBalance });
          });
      });
    })
    .catch((error) => {
      console.log("Error processing bet slip:", error);
    });
}
*/

export function FindOccurrencesOfBet(userId, targetBetName) {
  const userRef = ref(db, "betslipSet/" + userId);

  return get(userRef)
    .then((snapshot) => {
      if (!snapshot.exists()) {
        console.log("No bets found for the specified user.");
        return [];
      }

      const allBets = snapshot.val();
      let matchingBets = [];

      // Loop through each transaction and find matches
      for (let transactionId in allBets) {
        const betData = allBets[transactionId];

        // Check if `nameofbet` contains the target bet name
        const betNamesObj = betData.nameofbet;

        // Loop through each item in `nameofbet` to find matches
        for (let key in betNamesObj) {
          if (betNamesObj[key] === targetBetName) {
            matchingBets.push({
              transactionId: transactionId,
              ...betData,
            });
            break; // Exit inner loop once we find a match in this bet slip
          }
        }
      }

      if (matchingBets.length === 0) {
        console.log(`No occurrences of "${targetBetName}" found.`);
      } else {
        console.log(
          `Found ${matchingBets.length} occurrences of "${targetBetName}":`,
          matchingBets
        );
      }

      return matchingBets;
    })
    .catch((error) => {
      console.error("Error retrieving user data:", error);
      throw error; // Throw the error so that the caller can handle it
    });
}

// Function to cache straight bets and update user balance
export function cache_straights(userId, targetBetName) {
  const userRef = ref(db, "betslipSet/" + userId);

  return get(userRef)
    .then((snapshot) => {
      if (!snapshot.exists()) {
        console.log("No bets found for the specified user.");
        return;
      }

      const allBets = snapshot.val();
      let totalReturn = 0;

      // Loop through each transaction and find matching bets
      for (let transactionId in allBets) {
        const betData = allBets[transactionId];

        // Check if `nameofbet` matches target bet name and other conditions (unsettled is true, cache is false)
        const betNamesObj = betData.nameofbet;

        for (let key in betNamesObj) {
          if (
            betNamesObj[key] === targetBetName &&
            betData.unsettled === true &&
            betData.cache === "None"
          ) {
            // Calculate total return for this bet
            const totalBetOdds = betData.totalbetodds;
            const amountWagered = betData.amtwagered;
            const betReturn = totalBetOdds * amountWagered;

            // Update the total return
            totalReturn += betReturn;

            // Update the bet's cache to true (mark it as cached)
            betData.cache = true;
            betData.unsettled = false;
            betData.totalreturn = betReturn;
            // Update the bet in Realtime Database (optional, depending on use case)
            const betRef = ref(db, `betslipSet/${userId}/${transactionId}`);
            update(betRef, {
              cache: betData.cache,
              unsettled: betData.unsettled,
              totalreturn: betReturn, // Optionally include totalreturn if needed
            });
          }
        }
      }

      if (totalReturn === 0) {
        console.log(
          `No matching bets found for "${targetBetName}" with unsettled=true and cache=false.`
        );
        return;
      }

      // Update user's balance in Realtime Database
      const balanceRef = ref(db, `users/${userId}/balance`);
      get(balanceRef)
        .then((balanceSnapshot) => {
          const currentBalance = parseFloat(balanceSnapshot.val()) || 0;
          const updatedBalance = currentBalance + totalReturn;

          // Update balance in Realtime Database
          update(balanceRef, { balance: updatedBalance })
            .then(() => {
              console.log(
                `Updated balance for user ${userId} to ${updatedBalance}`
              );

              // Also update the balance in Firestore
              const loggedInUserId = localStorage.getItem("loggedInUserId");
              const userDocRef = doc(firestore, "users", loggedInUserId);

              return updateDoc(userDocRef, {
                balance: updatedBalance + totalReturn,
              });
            })
            .then(() => {
              alert(
                "Bet added successfully. New balance is: $" +
                  (updatedBalance + totalReturn).toFixed(2)
              );

              // Confirm balance update in Firestore
              alert("Balance updated successfully in Firestore.");
            })
            .catch((error) => {
              alert("Error updating Realtime Database: " + error);
            });
        })
        .catch((error) => {
          console.error("Error retrieving user balance:", error);
          alert("Error retrieving balance: " + error);
        });
    })
    .catch((error) => {
      console.error("Error retrieving user data:", error);
      alert("Error retrieving user data: " + error);
    });
}

export function getUserBalance() {
  const userId = localStorage.getItem("loggedInUserId");

  if (!userId) {
    console.log("User ID not found in localStorage.");
    return Promise.reject("User ID not found.");
  }

  // Reference to the user's document in the Firestore database
  const userRef = doc(firestore, "users", userId); // "users" is the collection, userId is the document ID

  return getDoc(userRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userBalance = userData.balance; // Assuming balance is stored under 'balance' field
        console.log("User balance:", userBalance);
        return userBalance;
      } else {
        console.log("No user data found for the specified user.");
        return null;
      }
    })
    .catch((error) => {
      console.error("Error fetching user balance from Firestore:", error);
      throw error;
    });
}

// Import axios

// Replace with your actual API key
const API_KEY = "476e4e29camsh75537a1cd930f5cp1fff3fjsnec1b55d737cb";
const BASE_URL = "https://api-nba-v1.p.rapidapi.com/";

// Function to call the API
async function fetchPlayerData() {
  const options = {
    method: "GET",
    url: `${BASE_URL}players`,
    params: {
      name: "lebron james", // Player's name
      season: "2024", // Season year
    },
    headers: {
      "x-rapidapi-key": API_KEY, // Your API key here
      "x-rapidapi-host": "api-nba-v1.p.rapidapi.com",
    },
  };

  try {
    // Making the API call using Axios
    const response = await axios.request(options);
    console.log(response.data); // Log the API response
  } catch (error) {
    console.error("Error fetching player data:", error); // Handle errors
  }
}

// Call the function
//fetchPlayerData();

// casino-functions.js

export function combineBets(betsCart) {
  if (!betsCart || betsCart.length === 0) {
    return [];
  }

  // Initialize arrays to hold combined data
  const userId = betsCart[0][0]; // Assuming all bets have the same user ID
  const betDescriptions = [];
  const odds = [];
  const games = [];
  const times = [];
  const restOfData = [];

  betsCart.forEach((bet) => {
    betDescriptions.push(bet[1]); // E.g., "[Sacramento Kings spread -3]"
    odds.push(parseFloat(bet[2])); // Convert odds to number
    games.push(bet[3]); // E.g., 'Sacramento Kings @ Boston Celtics'
    times.push(bet[4]); // E.g., 'Nov 22 • 7:10 PM'

    // Handle any additional data fields (indices 5 and onward)
    for (let i = 5; i < bet.length; i++) {
      if (!restOfData[i - 5]) {
        restOfData[i - 5] = [];
      }
      restOfData[i - 5].push(bet[i]);
    }
  });

  return [userId, betDescriptions, odds, games, times, ...restOfData];
}

export function parlayCombine(betsCart) {
  // Check if betsCart is empty
  if (!betsCart || betsCart.length === 0) {
    console.log("Bets cart is empty.");
    return [];
  }

  // Initialize arrays to hold combined data
  const userId = betsCart[0][0]; // Assume all bets have the same user ID
  const betDescriptions = [];
  const odds = [];
  const games = [];
  const times = [];
  const restOfData = []; // Placeholder for any remaining data
  //let totalOdds = 1; // Initialize total odds as 1 for multiplication

  // Iterate through each bet in the cart
  betsCart.forEach((bet) => {
    console.log("this is bet[2]", bet[2]);
    console.log("this is bet[1]", bet[1]);

    betDescriptions.push(JSON.parse(bet[1])); // Parse JSON strings into arrays
    odds.push(JSON.parse(bet[2])); //*= parseFloat(JSON.parse(bet[2]));
    games.push(bet[3]);
    times.push(bet[4]);

    // Collect any additional data (indices 5 onwards)
    for (let i = 5; i < bet.length; i++) {
      if (!restOfData[i - 5]) {
        restOfData[i - 5] = [];
      }
      restOfData[i - 5].push(bet[i]);
    }
  });
  console.log("testing if odds has NAN", odds);
  //totalOdds = Math.round(totalOdds * 100) / 100;

  // Combine into a single array
  const combinedData = [
    userId,
    betDescriptions,
    odds,
    games,
    times,
    ...restOfData,
  ];

  return combinedData;
}
