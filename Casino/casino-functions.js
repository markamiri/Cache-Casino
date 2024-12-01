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

          const betName = betSlip.betObject?.bet_1?.["bet name"]?.[0]; // Extract bet name[0]
          const betUser = betSlip.name;
          const betWager = betSlip.amtwagered;
          const totalbetodds = betSlip.totalbetodds;
          //get user balance var
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

          //new implemented code to work for team names with 3 words
          if (betName) {
            console.log(`Bet Name[0]: ${betName}`);
            //split the bet name into words
            const betWords = betName.split(" ");
            // check if the last word is moneyline
            const lastIndex = betWords[betWords.length - 1];
            if (lastIndex === "MoneyLine") {
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
                  }
                  // if the user bet visitor team ML and they lost
                  else {
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
                    game.homeTeam === teamName || game.visitorTeam === teamName
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
                }
              } else if (prop === "Over" || prop === "Under") {
              }
            }
          }
          //continue

          if (betName) {
            console.log(`Bet Name[0]: ${betName}`);

            // Split the bet name into words
            const betWords = betName.split(" "); // ['Denver', 'Nuggets', 'spread', '-3']
            const firsttwoIndex = betWords.slice(0, 2).join(" "); // 'Denver Nuggets'
            const thirdIndex = betWords[2]; // spread
            const fourthIndex = betWords[3]; // -3
            console.log(`Third Index: ${thirdIndex}`);
            console.log(`Fourth Index: ${fourthIndex}`);
            console.log(`First Two Index: ${firsttwoIndex}`);

            /*
            else {
              const betWords = betName.split(" "); // ['golden', 'state', 'warriors, 'spread', '-3']
              const firsttwoIndex = betWords.slice(0, 3).join(" "); // 'Denver Nuggets'
              const thirdIndex = betWords[2]; // spread
              const fourthIndex = betWords[3]; // -3
              console.log(`Third Index: ${thirdIndex}`);
              console.log(`Fourth Index: ${fourthIndex}`);
              console.log(`First Two Index: ${firsttwoIndex}`);
            }
            // Split the bet name into words
            */
            // Find the index in gameResults where the homeTeam or visitorTeam matches firsttwoIndex
            const matchingIndex = gameResults.findIndex(
              (game) =>
                game.homeTeam === firsttwoIndex ||
                game.visitorTeam === firsttwoIndex
            );

            if (matchingIndex !== -1) {
              const matchingGame = gameResults[matchingIndex];
              console.log(`Matching Game Found at Index: ${matchingIndex}`);
              console.log("Matching Game Details:", matchingGame);

              // Check if it's homeTeam or visitorTeam
              if (matchingGame.homeTeam === firsttwoIndex) {
                console.log(`${firsttwoIndex} is the Home Team`);
                if (thirdIndex === "spread") {
                  const visitorPoints = matchingGame.visitorPoints; // Access visitor points
                  const homePoints = matchingGame.homePoints; // Access home points
                  const fourthIndexInt = parseInt(fourthIndex, 10);
                  const newHomePoints = homePoints + fourthIndexInt;
                  console.log("new home points", newHomePoints);
                  console.log("visitor pts", visitorPoints);
                  if (newHomePoints > visitorPoints) {
                    const wager = get(ref(db));
                    console.log("bet cashed  ");

                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "cashed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      totalReturn: totalre,
                    });
                    //update under the users transactions
                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "cashed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        totalReturn: totalre,
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );

                    //update user balance
                    await set(
                      ref(db, `betslipSet/${betUser}/balance`),
                      potentialReturn
                    );

                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  } else if (newHomePoints < visitorPoints) {
                    console.log("bet failed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "failed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });

                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "failed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  } else {
                    console.log("bet pushed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "push",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });

                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "push",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    // update user balance, and update return for push under user transaction
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        totalReturn: betWager,
                      }
                    );
                    await set(
                      ref(db, `betslipSet/${betUser}/balance`),
                      pushReturnBalance
                      //After its been added to the user transactions, should delete from unsettled
                    );

                    await update(ref(db, `unsettled/${key}`), {
                      totalReturn: betWager,
                    });

                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  }
                } else if (thirdIndex === "MoneyLine") {
                  const winningTeam = matchingGame.winningTeam;
                  const winningTeamVar = winningTeam.split(" ")[0];
                  if (winningTeamVar === "home") {
                    console.log("bet cashed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "cashed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });
                    //Update in user transaction
                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "cashed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        totalReturn: totalre,
                      }
                    );
                    await set(
                      ref(db, `betslipSet/${betUser}/balance`),
                      potentialReturn
                    );

                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                    //update the balance and then remove from unsettled
                  } else {
                    console.log("bet failed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "failed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });

                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "failed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  }
                } else {
                  if (thirdIndex === "Over") {
                    console.log("testing if this is working", matchingGame);
                    const totalPoints = matchingGame.totalPoints;
                    const totalLine = fourthIndex;
                    if (totalPoints > totalLine) {
                      console.log("bet cashed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "cashed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });

                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "cashed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );

                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: totalre,
                        }
                      );

                      //update user balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );

                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else if (totalPoints < totalLine) {
                      console.log("bet failed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "failed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });

                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "failed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else {
                      console.log("bet pushed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "push",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "push",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      // update user balance, and update return for push on user transaction
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: betWager,
                        }
                      );
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        pushReturnBalance
                      );
                    }
                  }
                  if (thirdIndex === "Under") {
                    const totalPoints = matchingGame.totalPoints;

                    const totalLine = fourthIndex;

                    console.log(totalPoints, "total pts");
                    console.log(totalLine, "vegas line");
                    if (totalPoints < totalLine) {
                      console.log("bet cashed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "cashed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "cashed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        totalReturn: totalre,
                      });
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: totalre,
                        }
                      );

                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );

                      //update user balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );

                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else if (totalPoints > totalLine) {
                      console.log("bet failed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "failed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "failed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else {
                      console.log("bet pushed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "push",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "push",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: betWager,
                        }
                      );
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        pushReturnBalance
                        //After its been added to the user transactions, should delete from unsettled
                      );

                      await update(ref(db, `unsettled/${key}`), {
                        totalReturn: betWager,
                      });

                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    }
                  }
                }
              } else if (matchingGame.visitorTeam === firsttwoIndex) {
                console.log(`${firsttwoIndex} is the Visitor Team`);
                if (thirdIndex === "spread") {
                  const visitorPoints = matchingGame.visitorPoints; // Access visitor points
                  const homePoints = matchingGame.homePoints; // Access home points
                  const fourthIndexInt = parseInt(fourthIndex, 10);
                  const newvisitorPoints = visitorPoints + fourthIndexInt;
                  console.log("new visitor points", newvisitorPoints);
                  console.log("home pts", homePoints);
                  if (newvisitorPoints > homePoints) {
                    console.log("bet cashed ");

                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "cashed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });

                    //update for user transaction
                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "cashed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        totalReturn: totalre,
                      }
                    );
                    //update user balance
                    await set(
                      ref(db, `betslipSet/${betUser}/balance`),
                      potentialReturn
                    );

                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  } else if (newvisitorPoints < homePoints) {
                    console.log("bet failed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "failed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });

                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "failed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  } else {
                    console.log("bet pushed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "push",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });

                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "push",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );

                    // update user balance, and update return for push under user transaction
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        totalReturn: betWager,
                      }
                    );
                    await set(
                      ref(db, `betslipSet/${betUser}/balance`),
                      pushReturnBalance
                      //After its been added to the user transactions, should delete from unsettled
                    );

                    await update(ref(db, `unsettled/${key}`), {
                      totalReturn: betWager,
                    });

                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  }
                } else if (thirdIndex === "MoneyLine") {
                  const winningTeam = matchingGame.winningTeam;
                  const winningTeamVar = winningTeam.split(" ")[0];
                  if (winningTeamVar === "visitor") {
                    console.log("bet cashed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "cashed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });
                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "cashed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );

                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        totalReturn: totalre,
                      }
                    );
                    await set(
                      ref(db, `betslipSet/${betUser}/balance`),
                      potentialReturn
                    );

                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  } else {
                    console.log("bet failed ");
                    await update(ref(db, `unsettled/${key}/betObject/bet_1`), {
                      status: "failed",
                    });
                    await update(ref(db, `unsettled/${key}`), {
                      unsettled: "false",
                    });
                    await update(
                      ref(
                        db,
                        `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                      ),
                      {
                        status: "failed",
                      }
                    );
                    await update(
                      ref(db, `betslipSet/${betUser}/betslips/${key}`),
                      {
                        unsettled: "false",
                      }
                    );
                    await remove(ref(db, `unsettled/${key}`));
                    console.log(
                      `Key ${key} has been successfully removed from unsettled.`
                    );
                  }
                } else {
                  if (thirdIndex === "Over") {
                    console.log("testing if this is working", matchingGame);
                    const totalPoints = matchingGame.totalPoints;
                    const totalLine = fourthIndex;
                    if (totalPoints > totalLine) {
                      console.log("bet cashed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "cashed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });

                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "cashed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );

                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: totalre,
                        }
                      );

                      //update user balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );

                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else if (totalPoints < totalLine) {
                      console.log("bet failed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "failed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });

                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "failed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else {
                      console.log("bet pushed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "push",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "push",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      // update user balance, and update return for push on user transaction
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: betWager,
                        }
                      );
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        pushReturnBalance
                      );
                    }
                  }
                  if (thirdIndex === "Under") {
                    const totalPoints = matchingGame.totalPoints;
                    const totalLine = fourthIndex;
                    if (totalPoints < totalLine) {
                      console.log("bet cashed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "cashed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "cashed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        totalReturn: totalre,
                      });
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: totalre,
                        }
                      );

                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );

                      //update user balance
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        potentialReturn
                      );

                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else if (totalPoints > totalLine) {
                      console.log("bet failed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "failed",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "failed",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    } else {
                      console.log("bet pushed ");
                      await update(
                        ref(db, `unsettled/${key}/betObject/bet_1`),
                        {
                          status: "push",
                        }
                      );
                      await update(ref(db, `unsettled/${key}`), {
                        unsettled: "false",
                      });
                      await update(
                        ref(
                          db,
                          `betslipSet/${betUser}/betslips/${key}/betObject/bet_1`
                        ),
                        {
                          status: "push",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          unsettled: "false",
                        }
                      );
                      await update(
                        ref(db, `betslipSet/${betUser}/betslips/${key}`),
                        {
                          totalReturn: betWager,
                        }
                      );
                      await set(
                        ref(db, `betslipSet/${betUser}/balance`),
                        pushReturnBalance
                        //After its been added to the user transactions, should delete from unsettled
                      );

                      await update(ref(db, `unsettled/${key}`), {
                        totalReturn: betWager,
                      });

                      await remove(ref(db, `unsettled/${key}`));
                      console.log(
                        `Key ${key} has been successfully removed from unsettled.`
                      );
                    }
                  }
                }
              }
            } else {
              console.log(`No matching game found for: ${firsttwoIndex}`);
            }

            // Log other variables for reference
          } else {
            console.log("No bet name found for this slip.");
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
        totalbetodds: totalBetOdds,
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
  let totalOdds = 1; // Initialize total odds as 1 for multiplication

  // Iterate through each bet in the cart
  betsCart.forEach((bet) => {
    betDescriptions.push(JSON.parse(bet[1])); // Parse JSON strings into arrays
    totalOdds *= parseFloat(JSON.parse(bet[2]));
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
  totalOdds = Math.round(totalOdds * 100) / 100;

  // Combine into a single array
  const combinedData = [
    userId,
    betDescriptions,
    totalOdds,
    games,
    times,
    ...restOfData,
  ];

  return combinedData;
}
