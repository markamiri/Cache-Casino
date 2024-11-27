// casino-functions.js

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
  runTransaction,
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
