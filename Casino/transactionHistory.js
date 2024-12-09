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

export async function getUser() {
  // Retrieve the logged-in user ID from local storage
  const userId = localStorage.getItem("loggedInUserId");

  // Check if the user ID exists in local storage
  if (!userId) {
    console.log("No user found in local storage.");
    return null; // Return null if no user is logged in
  }

  console.log("User ID retrieved from local storage:", userId);

  // Initialize Firestore
  const firestore = getFirestore();

  try {
    // Reference the Firestore document for the user
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);

    // Check if the user document exists
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const username = userData.username;

      console.log("Username retrieved from Firestore:", username);
      return username; // Return the username
    } else {
      console.log("No user document found in Firestore for this ID.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user document from Firestore:", error);
    return null;
  }
}

export async function separateBetslips() {
  try {
    // Wait for the username to resolve
    const username = await getUser(); // Ensure getUser is resolved before proceeding

    if (!username) {
      console.error("No user found in local storage or Firebase.");
      return { unsettled: [], settled: [] };
    }

    // Construct the reference path using the resolved username
    const betslipsRef = ref(db, `betslipSet/${username}/betslips`);
    console.log(`Path: betslipSet/${username}`);

    // Fetch data from Firebase
    const snapshot = await get(betslipsRef);

    if (snapshot.exists()) {
      const betslipsData = snapshot.val();

      // Initialize the unsettled and settled arrays
      const unsettled = [];
      const settled = [];

      // Loop through the transactions and categorize them
      Object.keys(betslipsData).forEach((key) => {
        const betslip = betslipsData[key];
        const formattedBetslip = {
          amtwagered: betslip.amtwagered,
          betObject: betslip.betObject,
          totalReturn: betslip.totalReturn,
          unsettled: betslip.unsettled,
          totalbetodds: betslip.totalbetodds,
        };

        if (formattedBetslip.unsettled === true) {
          unsettled.push(formattedBetslip);
        } else {
          settled.push(formattedBetslip);
        }
      });

      console.log("Unsettled Bets:", unsettled);
      console.log("Settled Bets:", settled);

      // Return both arrays
      return { unsettled, settled };
    } else {
      console.log("No betslips found for the user.");
      return { unsettled: [], settled: [] };
    }
  } catch (error) {
    console.error("Error retrieving betslips:", error);
    return { unsettled: [], settled: [] };
  }
}

export async function printTransactionHistory() {
  const transactionHistory = document.getElementById("transactionHistory");
  const unsettledContainer = document.createElement("div");
  const settledContainer = document.createElement("div");
  const Open = document.getElementById("Open");
  const Settled = document.getElementById("Settled");

  // Add unique IDs to the containers for styling/identification
  unsettledContainer.id = "unsettledContainer";
  settledContainer.id = "settledContainer";

  try {
    // Wait for the separateBetslips function to resolve
    const { unsettled, settled } = await separateBetslips();

    // Populate the unsettledContainer
    console.log("Unsettled Transactions:", unsettled);
    unsettled.forEach((bet) => {
      if (
        bet.betObject &&
        bet.betObject.bet_1 &&
        bet.betObject.bet_1["bet name"]
      ) {
        const betNameArray = bet.betObject.bet_1["bet name"]; // Extract the array
        const betNameLength = betNameArray.length; // Get the length
        console.log("Bet Name Length:", betNameLength);
        console.log("Bet Name:", betNameArray);
        console.log("Bet name not found in this bet.");
        let unsettledContainer = document.getElementById("unsettledContainer"); // Make sure you have this container defined
        let amtwagered = bet.amtwagered;
        let totalbetodds = bet.totalbetodds; // Accessing totalbetodds within betObject safely

        console.log(amtwagered);
        console.log(totalbetodds);
        let potentialReturn = parseFloat(amtwagered) * parseFloat(totalbetodds);
        potentialReturn = potentialReturn.toFixed(2);
        const bottomRow = document.createElement("div");
        const bottomRowTop = document.createElement("div");
        const bottomRowBot = document.createElement("div");
        const wagerText = document.createElement("div");
        const returnText = document.createElement("div");
        wagerText.textContent = "Wager";
        wagerText.style.fontSize = "11px";
        returnText.textContent = "To Return";
        returnText.style.fontSize = "11px";
        bottomRowTop.style.display = "flex";
        bottomRowTop.style.justifyContent = "space-between";
        bottomRowTop.appendChild(wagerText);
        bottomRowTop.appendChild(returnText);
        bottomRowBot.style.display = "flex";
        bottomRowBot.style.justifyContent = "space-between";
        const amtwageredText = document.createElement("div");
        amtwageredText.textContent = `$${amtwagered}`;
        const potentialReturnText = document.createElement("div");
        potentialReturnText.textContent = `$${potentialReturn}`;
        bottomRowBot.appendChild(amtwageredText);
        bottomRowBot.appendChild(potentialReturnText);
        bottomRow.appendChild(bottomRowTop);
        bottomRow.appendChild(bottomRowBot);
        bottomRow.style.marginTop = "10px";

        if (!unsettledContainer) {
          // If it doesn't exist, create it
          unsettledContainer = document.createElement("div");
          unsettledContainer.id = "unsettled-container"; // Add an ID for identification
          transactionHistory.appendChild(unsettledContainer); // Append it to the transaction history
        }

        // Clear existing content before updating
        unsettledContainer.innerHTML = "";
        if (betNameLength === 1) {
          console.log("this is a straight");
          const betLink = document.createElement("div");

          betLink.style.borderRadius = "10px";
          betLink.style.marginLeft = "15px";
          betLink.style.marginTop = "10px";
          betLink.style.width = "230px";
          betLink.style.height = "140px";
          betLink.style.marginBottom = "45px"; // Add space between bet links

          betLink.style.backgroundColor = "rgb(232, 234, 237)";
          betLink.style.fontFamily = "sans-serif";

          const gameInfo = document.createElement("div");
          //gameInfo.style.backgroundColor = "lightpink";

          gameInfo.style.marginBottom = "5px";
          gameInfo.style.width = "208px";
          gameInfo.style.border = "none";

          gameInfo.style.color = "black";
          gameInfo.style.borderBottom = "1px solid #7F7D9C"; // Border only on the bottom
          // Optional background color
          gameInfo.style.paddingBottom = "3px";
          let nameArray = bet.betObject.bet_1["bet name"];
          let combinedString = nameArray.join(" "); // Combine all elements with a space
          let betNameArray = combinedString.split(" "); // Split the combined string if needed
          let status;
          let propName;
          let oddsName = bet.betObject.bet_1["odds"];
          let teamName = bet.betObject.bet_1["teamName"];
          console.log("Team Name:", teamName);
          const teamsDiv = document.createElement("div");
          teamsDiv.textContent = teamName;
          teamsDiv.style.fontSize = "12px";
          teamsDiv.style.fontStyle = "italic";
          teamsDiv.style.color = "rgb(28,28,31)";
          teamsDiv.style.paddingLeft = "10px";
          const cashOutContainer = document.createElement("div");
          cashOutContainer.style.width = "100%";
          cashOutContainer.style.display = "flex"; // Use Flexbox
          cashOutContainer.style.justifyContent = "center"; // Center horizontally
          cashOutContainer.style.alignItems = "center"; // Center vertically
          cashOutContainer.style.marginTop = "10px";
          cashOutContainer.style.height = "30px";
          const cashOutButton = document.createElement("button");
          cashOutButton.textContent = "Cash Out";
          cashOutButton.style.backgroundColor = "rgb(255, 220, 0)";
          cashOutButton.style.border = "none";
          cashOutButton.style.width = "100%";
          cashOutButton.style.borderRadius = "0px 0px 8px 8px";
          cashOutButton.style.backgroundColor = "#7F7D9C";
          cashOutButton.style.color = "white";
          cashOutButton.style.height = "30px";
          cashOutContainer.appendChild(cashOutButton);

          if (betNameArray.includes("MoneyLine")) {
            console.log("this bet name contains moneyline");
            status = betNameArray.pop();
            propName = betNameArray.pop();
            teamName = betNameArray.join(" ");
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
          } else if (
            betNameArray.includes("Over") ||
            betNameArray.includes("Under")
          ) {
            console.log("this bet contains Totals");
            console.log("this is the data", betNameArray);
            status = betNameArray.pop();
            let line = betNameArray.pop();
            let prop = betNameArray.pop();
            propName = prop + " " + line;
            teamsDiv.textContent = "";
          }

          const betOdds = document.createElement("div");
          const teamNamediv = document.createElement("div");
          const propNamediv = document.createElement("div");
          betOdds.textContent = `${oddsName}`;
          teamNamediv.textContent = `${teamName}`;
          propNamediv.textContent = `${propName}`;
          gameInfo.textContent = `$${amtwagered} Straight`;
          gameInfo.style.paddingLeft = "19px";
          gameInfo.style.paddingRight = "3px";
          gameInfo.style.paddingTop = "3px";
          gameInfo.style.paddingBottom = "3px";
          const headerDiv = document.createElement("div");
          headerDiv.appendChild(teamNamediv);
          headerDiv.appendChild(betOdds);
          headerDiv.style.display = "flex";
          headerDiv.style.justifyContent = "space-between";
          headerDiv.style.width = "210px";
          headerDiv.style.paddingLeft = "10px";
          propNamediv.style.fontSize = "12px";
          propNamediv.style.color = "rgb(36, 38, 41)";
          propNamediv.style.marginLeft = "10px";
          betLink.appendChild(gameInfo);
          betLink.appendChild(headerDiv);
          betLink.appendChild(propNamediv);
          betLink.appendChild(teamsDiv);
          betLink.appendChild(bottomRow);
          betLink.appendChild(cashOutContainer);

          unsettledContainer.appendChild(betLink);
        } else {
          console.log("this is a parlay");
        }
      }

      const betDiv = document.createElement("div");
      betDiv.textContent = `Unsettled Bet: ${JSON.stringify(bet)}`;
      unsettledContainer.appendChild(betDiv);
    });

    // Populate the settledContainer
    console.log("Settled Transactions:", settled);
    settled.forEach((bet) => {
      if (
        bet.betObject &&
        bet.betObject.bet_1 &&
        bet.betObject.bet_1["bet name"]
      ) {
        const betNameArray = bet.betObject.bet_1["bet name"]; // Extract the array
        const betNameLength = betNameArray.length; // Get the length
        console.log("Bet Name Length:", betNameLength);
        console.log("Bet Name:", betNameArray);
      } else {
        console.log(bet);
        console.log("Bet name not found in this bet.");
      }

      const betDiv = document.createElement("div");
      betDiv.textContent = `Settled Bet: ${JSON.stringify(bet)}`;
      settledContainer.appendChild(betDiv);
    });

    // Initially show the unsettledContainer and hide the settledContainer
    transactionHistory.appendChild(unsettledContainer);
    transactionHistory.appendChild(settledContainer);
    unsettledContainer.style.display = "block";
    settledContainer.style.display = "none";

    // Add event listeners to the buttons
    Open.addEventListener("click", () => {
      unsettledContainer.style.display = "block";
      settledContainer.style.display = "none";
    });

    Settled.addEventListener("click", () => {
      unsettledContainer.style.display = "none";
      settledContainer.style.display = "block";
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
  }
}

export async function displayBetslips() {
  const betslips = await separateBetslips();
  console.log("User's Betslips:", betslips);
}
