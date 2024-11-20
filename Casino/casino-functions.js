// casino-functions.js

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push,
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

export function AddData(userId, betName, odds, wagered) {
  const wageredAmount = parseFloat(wagered);
  const userRef = ref(db, "betslipSet/" + userId);
  const userBalanceRef = ref(db, "betslipSet/" + userId + "/balance");
  const transRef = ref(db, "unsettled/");

  let currentBalance = 500;
  let nextTransactionNumber = 1;

  get(userBalanceRef)
    .then((balanceSnapshot) => {
      if (balanceSnapshot.exists()) {
        currentBalance = balanceSnapshot.val();
      } else {
        return set(userBalanceRef, currentBalance);
      }
    })
    .then(() => {
      return get(userRef);
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        // If there are existing transactions, get the highest transaction number and increment it.
        const allTransactions = snapshot.val();
        const transactionKeys = Object.keys(allTransactions).filter(
          (key) => key !== "balance"
        );

        // If there are transaction keys, find the highest one and increment it by 1.
        if (transactionKeys.length > 0) {
          nextTransactionNumber = Math.max(...transactionKeys.map(Number)) + 1;
        }
      }

      // If wagered amount is more than current balance, alert the user.
      if (wageredAmount > currentBalance) {
        alert(
          "Insufficient funds. Your current balance is: $" + currentBalance
        );
        return;
      } else {
        const newBalance = currentBalance - wageredAmount;
        return set(userBalanceRef, newBalance).then(() => {
          console.log("User balance has been successfully updated.");

          const betNames =
            typeof betName === "string" ? JSON.parse(betName) : [betName];
          const oddsArray =
            typeof odds === "string" ? JSON.parse(odds) : [odds];
          const betOddsObj = Object.fromEntries(
            betNames.map((bet, index) => [bet, oddsArray[index]])
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

          // Create the new bet slip entry with the next transaction number.
          return set(
            ref(db, "betslipSet/" + userId + "/" + nextTransactionNumber),
            betData
          )
            .then(() => {
              alert("Bet added successfully. New Balance is: $" + newBalance);
              const unsettledRef = ref(db, "unsettled/");
              return push(unsettledRef, betData);
            })
            .then(() => {
              const loggedInUserId = localStorage.getItem("loggedInUserId");
              const userDocRef = doc(firestore, "users", loggedInUserId);
              return updateDoc(userDocRef, { balance: newBalance });
            });
        });
      }
    })
    .catch((error) => {
      console.log("error processing bet slip:", error);
    });
}

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
