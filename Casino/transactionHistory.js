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
        console.log("is this the bet id?", key);
        const formattedBetslip = {
          id: key,
          amtwagered: betslip.amtwagered,
          betObject: betslip.betObject,
          totalReturn: betslip.totalReturn,
          unsettled: betslip.unsettled,
          totalbetodds: betslip.totalbetodds,
          timeSettled: betslip.timeSettled,
          timePlaced: betslip.timePlaced,
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
        const flattenedBetNameArray = Array.isArray(betNameArray[0])
          ? betNameArray[0]
          : betNameArray; // Access the nested array
        const betNameLength = flattenedBetNameArray.length; // Get the length of the nested array
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
        bottomRow.style.width = "437px";
        bottomRow.style.marginLeft = "20px";

        if (!unsettledContainer) {
          // If it doesn't exist, create it
          unsettledContainer = document.createElement("div");
          unsettledContainer.id = "unsettled-container"; // Add an ID for identification
          unsettledContainer.classList.add("unsettled-container");
          transactionHistory.appendChild(unsettledContainer); // Append it to the transaction history
        }

        // Clear existing content before updating
        unsettledContainer.innerHTML = "";
        if (betNameLength === 1) {
          console.log("this is a straight");
          const betLink = document.createElement("div");

          betLink.style.marginLeft = "15px";
          betLink.style.marginTop = "10px";
          betLink.style.width = "477px";
          betLink.style.marginBottom = "45px"; // Add space between bet links
          betLink.style.borderRadius = "3px 3px 0px 0px";
          betLink.style.backgroundColor = "rgb(232, 234, 237)";
          betLink.style.fontFamily = "sans-serif";

          const gameInfo = document.createElement("div");
          //gameInfo.style.backgroundColor = "lightpink";

          gameInfo.classList.add("gameInfo");
          gameInfo.style.marginBottom = "5px";
          gameInfo.style.width = "437px";
          gameInfo.style.border = "none";
          gameInfo.style.paddingTop = "3px";
          gameInfo.style.paddingBottom = "3px";
          gameInfo.style.height = "40px";
          gameInfo.style.display = "flex";
          gameInfo.style.justifyContent = "space-between";
          gameInfo.style.alignItems = "center";
          gameInfo.style.marginLeft = "20px";
          gameInfo.style.color = "black";
          gameInfo.style.fontWeight = "bold";
          gameInfo.style.fontSize = "18px";
          gameInfo.style.borderBottom = "1px solid #7F7D9C"; // Border only on the bottom
          // Optional background color
          let nameArray = bet.betObject.bet_1["bet name"];
          let combinedString = nameArray.join(" "); // Combine all elements with a space
          let betNameArray = combinedString.split(" "); // Split the combined string if needed
          let status;
          let propName;
          let oddsName = bet.betObject.bet_1["odds"];
          let teamName = bet.betObject.bet_1["teamName"];
          console.log("This is the teamName", nameArray);
          let timePlaced = bet.timePlaced;

          let betId = bet.id;
          const teamsDiv = document.createElement("div");
          teamsDiv.textContent = teamName;
          teamsDiv.style.fontSize = "12px";
          teamsDiv.style.fontStyle = "italic";
          teamsDiv.style.color = "rgb(28,28,31)";
          const cashOutContainer = document.createElement("div");
          cashOutContainer.style.width = "437px";
          cashOutContainer.style.display = "flex"; // Use Flexbox
          cashOutContainer.style.justifyContent = "center"; // Center horizontally
          cashOutContainer.style.alignItems = "center"; // Center vertically
          cashOutContainer.style.marginTop = "10px";
          cashOutContainer.style.height = "30px";
          cashOutContainer.style.marginLeft = "20px";
          const cashOutButton = document.createElement("button");
          cashOutButton.textContent = `Cash Out $${amtwagered}`;
          cashOutButton.style.fontWeight = "bold";
          cashOutButton.style.backgroundColor = "rgb(255, 220, 0)";
          cashOutButton.style.border = "none";
          cashOutButton.style.width = "100%";
          cashOutButton.style.borderRadius = "0px 0px 3px 3px";
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
          let betIdContainer = document.createElement("div");
          let betIdDiv = document.createElement("div");
          betIdDiv.textContent = `ID : ${betId} `;
          let timePlacedDiv = document.createElement("div");
          timePlacedDiv.textContent = `Placed: ${timePlaced}`;
          betIdContainer.style.marginLeft = "20px";
          betIdContainer.style.fontSize = "13px";
          betIdContainer.style.color = "rgb(36, 38, 41)";
          betIdContainer.style.paddingBottom = "15px";
          betIdContainer.style.marginTop = "5px";
          betIdContainer.appendChild(timePlacedDiv);
          betIdContainer.appendChild(betIdDiv);

          const betOdds = document.createElement("div");
          const teamNamediv = document.createElement("div");
          const propNamediv = document.createElement("div");
          betOdds.textContent = `${oddsName}`;
          teamNamediv.textContent = `${teamName}`;
          propNamediv.textContent = `${propName}`;
          gameInfo.textContent = `Straight`;

          const headerDiv = document.createElement("div");
          headerDiv.appendChild(teamNamediv);
          headerDiv.appendChild(betOdds);
          headerDiv.style.display = "flex";
          headerDiv.style.justifyContent = "space-between";
          headerDiv.style.width = "437px";
          headerDiv.style.marginLeft = "20px";
          headerDiv.style.fontWeight = "bold";
          propNamediv.style.fontSize = "12px";
          propNamediv.style.color = "rgb(36, 38, 41)";
          propNamediv.style.marginLeft = "20px";
          teamsDiv.style.marginLeft = "20px";
          headerDiv.classList.add("headerDiv");
          propNamediv.classList.add("propNameDiv");
          teamsDiv.classList.add("teamsDiv");
          bottomRow.classList.add("bottomRow");
          cashOutContainer.classList.add("cashOutContainer");
          bottomRow.style.borderTop = "1px solid #7F7D9C";
          bottomRow.style.paddingTop = "10px";
          betLink.appendChild(gameInfo);
          betLink.appendChild(headerDiv);
          betLink.appendChild(propNamediv);
          betLink.appendChild(teamsDiv);
          betLink.appendChild(bottomRow);
          betLink.appendChild(cashOutContainer);
          betLink.appendChild(betIdContainer);
          let temp = document.createElement("img");
          temp.style.width = "256px";
          temp.style.height = "144px";
          temp.src = "static/icons/cache_receipt_logo.png";
          //betLink.appendChild(temp);
          unsettledContainer.appendChild(betLink);
        } else if (betNameLength > 1) {
          console.log("this is a parlay");
          const betLink = document.createElement("div");
          let nameArray = bet.betObject.bet_1["bet name"];
          let combinedString = nameArray.join(" "); // Combine all elements with a space
          let betNameArray = combinedString.split(" "); // Split the combined string if needed
          console.log("this is the betNameArray", nameArray);
          let status;
          let propName;
          let oddsName = bet.betObject.bet_1["odds"];
          console.log("this is the oddsName", oddsName);
          let oddsArray = oddsName;
          let teamName = bet.betObject.bet_1["teamName"];
          console.log("this is the teamName", teamName);
          let timePlaced = bet.timePlaced;
          let betId = bet.id;

          let oddsArrayFloat = bet.betObject.bet_1["odds"].map(parseFloat);
          let totalOdds = oddsArrayFloat.reduce(
            (acc, current) => acc * current,
            1
          );
          totalOdds = Number(totalOdds.toFixed(2));

          betLink.style.marginLeft = "15px";
          betLink.style.marginTop = "10px";
          betLink.style.width = "477px";
          betLink.style.marginBottom = "45px"; // Add space between bet links
          betLink.style.borderRadius = "3px 3px 0px 0px";
          betLink.style.backgroundColor = "rgb(232, 234, 237)";
          betLink.style.fontFamily = "sans-serif";

          const gameInfo = document.createElement("div");
          //gameInfo.style.backgroundColor = "lightpink";

          gameInfo.classList.add("gameInfo");
          gameInfo.style.marginBottom = "5px";
          gameInfo.style.width = "437px";
          gameInfo.style.border = "none";
          gameInfo.style.paddingTop = "3px";
          gameInfo.style.paddingBottom = "3px";
          gameInfo.style.height = "40px";
          gameInfo.style.display = "flex";
          gameInfo.style.justifyContent = "space-between";
          gameInfo.style.alignItems = "center";
          gameInfo.style.marginLeft = "20px";
          gameInfo.style.color = "black";
          gameInfo.style.fontWeight = "bold";
          gameInfo.style.fontSize = "18px";
          gameInfo.style.borderBottom = "1px solid #7F7D9C"; // Border only on the bottom
          gameInfo.textContent = "Parlay";

          let totaloddsdiv = document.createElement("div");
          totaloddsdiv.textContent = `${totalOdds}`;
          gameInfo.appendChild(totaloddsdiv);

          const parlayMiddle = document.createElement("div");
          for (let i = 0; i < nameArray.length; i++) {
            const nameOdds = document.createElement("div");
            nameOdds.style.display = "flex";
            nameArray = Array.isArray(nameArray[0]) ? nameArray[0] : nameArray; // Access the nested array
            console.log(`Index ${i}:`, nameArray[i], typeof nameArray[i]);

            let nameArraySplit = nameArray[i].split(" ");
            let lastWord = nameArraySplit.pop(); // Use pop() only once
            console.log("Last word:", lastWord);

            let line = nameArraySplit.pop();
            console.log("Line:", line);

            let prop = nameArraySplit.pop();
            console.log("Prop:", prop);

            let betInfo;
            let betName;
            if (prop !== "MoneyLine") {
              if (prop === "spread") {
                if (parseFloat(line) > 0) {
                  line = "+" + line;
                }
                betInfo = line + " " + prop;
              } else if (prop === "Over" || prop === "Under") {
                betInfo = prop + " " + line;
              }
            } else {
              betInfo = prop;
            }
            console.log("this is the betInfo", betInfo);
            let betInfoDiv = document.createElement("div");
            betInfoDiv.textContent = betInfo;
            betInfoDiv.style.display = "None";
            nameArraySplit = nameArraySplit.join(" ");
            const legNameContainer = document.createElement("div");

            const legName = document.createElement("div");
            if (prop === "spread") {
              legName.textContent = `${nameArraySplit} ${line} `;
            } else if (prop === "Over" || prop === "Under") {
              legName.textContent = ` ${betInfo} `;
            }

            const gameDescription = document.createElement("div");
            let teamDescriptionArray = teamName;
            let teams = teamDescriptionArray[i]
              .split("@")
              .map((team) => team.trim());
            let updatedTeams = teams.map((team) => {
              let words = team.split(" "); // Split the team name into words
              words.shift(); // Remove the first word
              return words.join(" "); // Rejoin the remaining words
            });
            let updatedTeamName = updatedTeams.join(" @ ");
            updatedTeamName = teamDescriptionArray[i];
            gameDescription.textContent = `${updatedTeamName}`;
            gameDescription.style.fontSize = "12px";
            gameDescription.style.fontStyle = "italic";
            gameDescription.style.color = "rgb(28, 28, 31)";
            legNameContainer.appendChild(legName);
            legNameContainer.style.display = "flex";
            legNameContainer.style.justifyContent = "space-between";
            legNameContainer.style.width = "437px";
            const legOdds = document.createElement("div");
            legOdds.textContent = `${oddsArray[i]}`;
            legOdds.style.marginLeft = "86px";
            nameOdds.style.fontWeight = "bold";
            nameOdds.appendChild(legNameContainer);
            nameOdds.appendChild(legOdds);
            nameOdds.style.display = "flex";
            nameOdds.style.justifyContent = "space-between";
            const betCont = document.createElement("div");
            betCont.appendChild(nameOdds);
            betInfoDiv.style.fontSize = "12px";
            betInfoDiv.style.color = "rgb(36, 38, 41)";
            betCont.appendChild(betInfoDiv);
            betCont.appendChild(gameDescription);
            betCont.style.marginBottom = "5px";
            parlayMiddle.style.fontFamily = "sans-serif";
            parlayMiddle.appendChild(betCont);
            parlayMiddle.style.marginLeft = "20px";
          }
          parlayMiddle.style.width = "437px";
          gameInfo.classList.add("gameInfo");
          betLink.appendChild(gameInfo);

          betLink.appendChild(parlayMiddle);
          parlayMiddle.classList.add("parlayMiddle");
          parlayMiddle.style.marginBottom = "10px";
          console.log("amtwagered Parlay", amtwagered);
          console.log("totalbetodds Parlay", totalOdds);
          let potentialReturn = parseFloat(amtwagered) * parseFloat(totalOdds);
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
          bottomRow.style.width = "437px";
          bottomRow.style.marginLeft = "20px";
          bottomRow.style.borderTop = "1px solid #7F7D9C";
          bottomRow.style.paddingTop = "10px";

          const cashOutContainer = document.createElement("div");
          cashOutContainer.style.width = "100%";
          cashOutContainer.style.display = "flex"; // Use Flexbox
          cashOutContainer.style.justifyContent = "center"; // Center horizontally
          cashOutContainer.style.alignItems = "center"; // Center vertically
          cashOutContainer.style.marginTop = "10px";
          cashOutContainer.style.height = "30px";
          const cashOutButton = document.createElement("button");
          cashOutButton.textContent = `Cash Out $${amtwagered}`;
          cashOutButton.style.fontWeight = "bold";
          cashOutButton.style.backgroundColor = "rgb(255, 220, 0)";
          cashOutButton.style.border = "none";
          cashOutButton.style.width = "437px";
          cashOutButton.style.borderRadius = "0px 0px 3px 3px";
          cashOutButton.style.backgroundColor = "#7F7D9C";
          cashOutButton.style.color = "white";
          cashOutButton.style.height = "30px";
          cashOutContainer.appendChild(cashOutButton);

          let betIdContainer = document.createElement("div");
          let betIdDiv = document.createElement("div");
          betIdDiv.textContent = `ID : ${betId} `;
          let timePlacedDiv = document.createElement("div");
          timePlacedDiv.textContent = `Settled: ${timePlaced}`;
          betIdContainer.style.marginLeft = "20px";
          betIdContainer.style.marginTop = "5px";
          betIdContainer.style.color = "rgb(36, 38, 41)";
          betIdContainer.style.fontSize = "13px";
          betIdContainer.style.paddingBottom = "15px";

          bottomRow.classList.add("bottomRow");

          cashOutContainer.classList.add("cashOutContainer");

          timePlacedDiv.classList.add("timePlacedDiv");
          betIdDiv.classList.add("betIdDiv");

          betIdContainer.classList.add("betIdContainer");

          unsettledContainer.classList.add("unsettledContainer");
          betLink.appendChild(bottomRow);

          betLink.appendChild(cashOutContainer);

          betIdContainer.appendChild(timePlacedDiv);
          betIdContainer.appendChild(betIdDiv);
          betLink.appendChild(betIdContainer);
          unsettledContainer.appendChild(betLink);
        }
      }

      const betDiv = document.createElement("div");
      betDiv.textContent = `Unsettled Bet: ${JSON.stringify(bet)}`;
      unsettledContainer.appendChild(betDiv);
    });

    settled.forEach((bet) => {
      if (
        bet.betObject &&
        bet.betObject.bet_1 &&
        bet.betObject.bet_1["bet name"]
      ) {
        console.log("settled bet name", bet);
        const betNameArray = bet.betObject.bet_1["bet name"]; // Extract the array
        const betNameLength = betNameArray.length; // Get the length

        //Container for the betslip
        let settledContainer = document.getElementById("unsettledContainer"); // Make sure you have this container defined
        let amtwagered = bet.amtwagered;
        let totalbetodds = bet.totalbetodds;
        let totalReturn = bet.totalReturn;
        let betId = bet.id;
        let timeSettled = bet.timeSettled;

        let potentialReturn = parseFloat(amtwagered) * parseFloat(totalbetodds);
        potentialReturn = potentialReturn.toFixed(2);
        const bottomRow = document.createElement("div");
        const bottomRowTop = document.createElement("div");
        const bottomRowBot = document.createElement("div");
        const wagerText = document.createElement("div");
        const returnText = document.createElement("div");
        wagerText.textContent = "Wager";
        wagerText.style.fontSize = "11px";
        returnText.textContent = "Potential Return";
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
        bottomRow.style.borderTop = "1px solid #7F7D9C";
        bottomRow.style.width = "437px";
        bottomRow.style.marginLeft = "20px";
        if (!settledContainer) {
          settledContainer = document.createElement("div");
          settledContainer.id = "settled-container"; // Add an ID for identification
          settledContainer.classList.add("settled-container");
          transactionHistory.appendChild(settledContainer); // Append it to the transaction history
        }
        settledContainer.innerHTML = "";
        if (betNameLength === 1) {
          console.log("this is a settled straight ");

          const betLink = document.createElement("div");

          betLink.style.marginLeft = "15px";
          betLink.style.marginTop = "10px";
          betLink.style.width = "477px";
          betLink.style.marginBottom = "45px"; // Add space between bet links
          betLink.style.borderRadius = "3px 3px 0px 0px";
          betLink.style.backgroundColor = "rgb(232, 234, 237)";
          betLink.style.fontFamily = "sans-serif";

          const gameInfo = document.createElement("div");
          //gameInfo.style.backgroundColor = "lightpink";

          gameInfo.style.marginBottom = "5px";
          gameInfo.style.width = "437px";
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
          let teams = teamName.split("@").map((team) => team.trim());
          /*
          let updatedTeams = teams.map((team) => {
            let words = team.split(" "); // Split the team name into words
            words.shift(); // Remove the first word
            return words.join(" "); // Rejoin the remaining words
          });

          // Join the updated team names with "@" again
          let updatedTeamName = updatedTeams.join(" @ ");
          teamName = updatedTeamName;
          */
          let resultStatus = bet.betObject.bet_1["status"];
          let statusIcon = document.createElement("img");
          if (resultStatus === "push") {
            resultStatus = "Pushed";
            statusIcon.src = "static/settled-icon/push.png"; // Correct path for web
            statusIcon.alt = "Checkmark"; // Add alt text for accessibility
            statusIcon.style.width = "20px"; // Example width
            statusIcon.style.height = "20px"; // Example height
            statusIcon.style.marginLeft = "10px"; // Add margin for spacing
          } else if (resultStatus === "cashed") {
            resultStatus = "Cached";
            statusIcon.src = "static/settled-icon/checkmark.png"; // Correct path for web
            statusIcon.alt = "Checkmark"; // Add alt text for accessibility
            statusIcon.style.width = "20px"; // Example width
            statusIcon.style.height = "20px"; // Example height
            statusIcon.style.marginLeft = "10px"; // Add margin for spacing
          } else {
            resultStatus = "Defeated";
            statusIcon.src = "static/settled-icon/failed.png"; // Correct path for web
            statusIcon.alt = "Checkmark"; // Add alt text for accessibility
            statusIcon.style.width = "20px"; // Example width
            statusIcon.style.height = "20px"; // Example height
            statusIcon.style.marginLeft = "10px"; // Add margin for spacing
          }
          //here

          let title;
          const teamsDiv = document.createElement("div");
          teamsDiv.textContent = teamName;
          teamsDiv.style.fontSize = "12px";
          teamsDiv.style.fontStyle = "italic";
          teamsDiv.style.color = "rgb(28,28,31)";
          teamsDiv.style.marginLeft = "20px";
          teamsDiv.style.marginBottom = "10px";
          const legName = document.createElement("div");
          const propNamediv = document.createElement("div");

          if (betNameArray.includes("MoneyLine")) {
            console.log("this bet name contains moneyline");
            status = betNameArray.pop();
            propName = betNameArray.pop();
            teamName = betNameArray.join(" ");
            legName.textContent = `${teamName} ${propName}`;
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
              title = betNameArray.join(" ") + " " + line;
            } else if (numericLine > 0) {
              propName = prop + ":" + " " + "+" + line;
              title = betNameArray.join(" ") + " " + "+" + line;
            }
            console.log("this is the title", title);
            console.log("this is the teamName", teamName);
            legName.textContent = `${title}`;
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
            legName.textContent = `${propName}`;
            betNameArray = betNameArray + prop;
          }
          const legNameContainer = document.createElement("div");

          legNameContainer.appendChild(legName);
          legNameContainer.appendChild(statusIcon);
          legNameContainer.style.display = "flex";
          legNameContainer.style.justifyContent = "space-between";
          legNameContainer.style.width = "400px";

          console.log("Team Name:", teamName);

          const cashOutContainer = document.createElement("div");
          cashOutContainer.style.width = "100%";
          cashOutContainer.style.display = "flex"; // Use Flexbox
          cashOutContainer.style.justifyContent = "center"; // Center horizontally
          cashOutContainer.style.alignItems = "center"; // Center vertically
          cashOutContainer.style.marginTop = "10px";
          cashOutContainer.style.height = "30px";
          const cashOutButton = document.createElement("button");
          cashOutButton.textContent = `$${totalReturn} Won on Cache!`;
          cashOutButton.style.fontWeight = "bold";
          cashOutButton.style.backgroundColor = "rgb(255, 220, 0)";
          cashOutButton.style.border = "none";
          cashOutButton.style.width = "437px";
          cashOutButton.style.borderRadius = "0px 0px 3px 3px";
          cashOutButton.style.backgroundColor = "#7F7D9C";
          cashOutButton.style.color = "white";
          cashOutButton.style.height = "30px";
          cashOutContainer.appendChild(cashOutButton);

          const betOdds = document.createElement("div");
          const teamNamediv = document.createElement("div");
          betOdds.textContent = `${oddsName}`;
          teamNamediv.textContent = `${teamName}`;
          propNamediv.textContent = `${propName}`;
          gameInfo.style.paddingTop = "3px";
          gameInfo.style.paddingBottom = "3px";
          gameInfo.style.height = "40px";
          gameInfo.style.display = "flex";
          gameInfo.style.justifyContent = "space-between";
          let betId = bet.id;
          let timeSettled = bet.timeSettled;

          let betIdContainer = document.createElement("div");
          let betIdDiv = document.createElement("div");
          betIdDiv.textContent = `ID : ${betId} `;
          let timeSettledDiv = document.createElement("div");
          timeSettledDiv.textContent = `Settled: ${timeSettled}`;

          betIdContainer.appendChild(timeSettledDiv);
          betIdContainer.appendChild(betIdDiv);

          betIdContainer.style.marginLeft = "20px";
          betIdContainer.style.fontSize = "13px";
          betIdContainer.style.color = "rgb(36, 38, 41)";
          betIdContainer.style.paddingBottom = "45px";
          betIdContainer.style.marginTop = "5px";
          let result = document.createElement("button");
          result.textContent = `${resultStatus}`;
          result.style.fontSize = "14px";
          result.style.height = "30px";
          let betSlipType = document.createElement("div");
          if (betNameLength === 1) {
            betSlipType.textContent = "Straight";
          } else {
            betSlipType.textContent = "Parlay";
          }
          betSlipType.style.fontSize = "18px";
          betSlipType.style.fontWeight = "bold";
          betSlipType.style.fontFamily = "sans-serif";
          gameInfo.appendChild(betSlipType);
          //gameInfo.appendChild(result);
          gameInfo.style.alignItems = "center";
          gameInfo.style.marginLeft = "20px";

          const headerDiv = document.createElement("div");
          headerDiv.appendChild(legNameContainer);
          betOdds.style.marginLeft = "6px";
          headerDiv.appendChild(betOdds);

          headerDiv.style.display = "flex";
          headerDiv.style.width = "437px";
          headerDiv.style.marginLeft = "20px";
          headerDiv.style.fontWeight = "bold";
          propNamediv.style.fontSize = "12px";
          propNamediv.style.color = "rgb(36, 38, 41)";
          propNamediv.style.marginLeft = "20px";
          betLink.style.clipPath =
            "polygon(0 0, 100% 0, 100% 90%, 95% 95%, 90% 90%, 85% 95%, 80% 90%, 75% 95%, 70% 90%, 65% 95%, 60% 90%, 55% 95%, 50% 90%, 45% 95%, 40% 90%, 35% 95%, 30% 90%, 25% 95%, 20% 90%, 15% 95%, 10% 90%, 5% 95%, 0 90%)";
          betLink.appendChild(gameInfo);
          gameInfo.classList.add("gameInfo");

          betLink.appendChild(headerDiv);
          headerDiv.classList.add("headerDiv");

          //betLink.appendChild(propNamediv);
          console.log("newbetName Array", betNameArray);
          if (betNameArray.includes("Over") || betNameArray.includes("Under")) {
            propNamediv.textContent = teamName;
            betLink.appendChild(propNamediv);
          }

          propNamediv.classList.add("propNamediv");

          betLink.appendChild(teamsDiv);
          teamsDiv.classList.add("teamsDiv");
          bottomRow.style.paddingTop = "5px";

          betLink.appendChild(bottomRow);
          bottomRow.classList.add("bottomRow");

          betLink.appendChild(cashOutContainer);
          cashOutContainer.classList.add("cashOutContainer");

          betLink.appendChild(betIdContainer);
          betIdContainer.classList.add("betIdContainer");
          settledContainer.appendChild(betLink);
        } else if (betNameLength > 1) {
          console.log("This is a settled parlay");
          const betLink = document.createElement("div");
          betLink.style.marginLeft = "15px";
          betLink.style.marginTop = "10px";
          betLink.style.width = "477px";
          betLink.style.marginBottom = "45px"; // Add space between bet links
          betLink.style.borderRadius = "3px 3px 0px 0px";
          betLink.style.backgroundColor = "rgb(232, 234, 237)";
          betLink.style.fontFamily = "sans-serif";
          const gameInfo = document.createElement("div");
          //gameInfo.style.backgroundColor = "lightpink";

          gameInfo.style.marginBottom = "5px";
          gameInfo.style.width = "437px";
          gameInfo.style.border = "none";
          let nameArray = bet.betObject.bet_1["bet name"];
          let oddsArray = bet.betObject.bet_1["odds"];
          let teamDescriptionArray = bet.betObject.bet_1["teamName"];
          console.log("is this correct tda", teamDescriptionArray);
          let oddsArrayFloat = bet.betObject.bet_1["odds"].map(parseFloat);
          let totalOdds = oddsArrayFloat.reduce(
            (acc, current) => acc * current,
            1
          );
          totalOdds = Number(totalOdds.toFixed(2));
          console.log("Total Odds:", totalOdds);
          //need to add the team names here in the future after we get the parlay container going
          let resultStatus = bet.betObject.bet_1["status"];
          if (resultStatus === "push") {
            resultStatus = "Pushed";
          } else if (resultStatus === "cashed") {
            resultStatus = "Cached";
          } else {
            resultStatus = "Defeated";
          }
          const parlayMiddle = document.createElement("div");
          for (let i = 0; i < nameArray.length; i++) {
            const nameOdds = document.createElement("div");
            nameOdds.style.display = "flex";
            const statusIcon = document.createElement("img");
            let nameArraySplit = nameArray[i].split(" ");
            let lastWord = nameArraySplit.pop(); // Use pop() only once
            let prop = nameArraySplit.pop();
            let line;
            let betInfo;
            if (prop !== "MoneyLine") {
              if (prop === "spread") {
                line = nameArraySplit.pop();
                if (parseFloat(line) > 0) {
                  line = "+" + line;
                }
                betInfo = line + " " + prop;
              } else if (prop === "Over" || prop === "Under") {
                line = nameArraySplit.pop();
                betInfo = prop + " " + line;
              }
            } else {
              betInfo = prop;
            }
            let betInfoDiv = document.createElement("div");
            betInfoDiv.textContent = betInfo;
            betInfoDiv.style.display = "None";
            nameArraySplit = nameArraySplit.join(" ");
            if (lastWord === "cache") {
              statusIcon.src = "static/settled-icon/checkmark.png"; // Correct path for web
              statusIcon.alt = "Checkmark"; // Add alt text for accessibility
              statusIcon.style.width = "20px"; // Example width
              statusIcon.style.height = "20px"; // Example height
              statusIcon.style.marginLeft = "10px"; // Add margin for spacing
            } else if (lastWord === "push") {
              statusIcon.src = "static/settled-icon/push.png"; // Correct path for web
              statusIcon.alt = "Checkmark"; // Add alt text for accessibility
              statusIcon.style.width = "20px"; // Example width
              statusIcon.style.height = "20px"; // Example height
              statusIcon.style.marginLeft = "10px"; // Add margin for spacing
            } else if (lastWord === "failed") {
              statusIcon.src = "static/settled-icon/failed.png"; // Correct path for web
              statusIcon.alt = "Checkmark"; // Add alt text for accessibility
              statusIcon.style.width = "20px"; // Example width
              statusIcon.style.height = "20px"; // Example height
              statusIcon.style.marginLeft = "10px"; // Add margin for spacing
            }
            const legNameContainer = document.createElement("div");

            const legName = document.createElement("div");
            console.log("this is the prop", prop);
            if (prop === "Over" || prop === "Under") {
              legName.textContent = `${betInfo}`;
            } else if (prop === "MoneyLine") {
              legName.textContent = `${nameArraySplit} ${prop}`;
            } else {
              legName.textContent = `${nameArraySplit} ${line}`;
            }

            const gameDescription = document.createElement("div");

            let teams = teamDescriptionArray[i]
              .split("@")
              .map((team) => team.trim());
            let updatedTeams = teams.map((team) => {
              let words = team.split(" "); // Split the team name into words
              words.shift(); // Remove the first word
              return words.join(" "); // Rejoin the remaining words
            });

            // Join the updated team names with "@" again
            let updatedTeamName = updatedTeams.join(" @ ");
            //CODE CHANGED HERE
            updatedTeamName = teamDescriptionArray[i];
            gameDescription.textContent = `${updatedTeamName}`;
            gameDescription.style.fontSize = "12px";
            gameDescription.style.fontStyle = "italic";
            gameDescription.style.color = "rgb(28, 28, 31)";
            legNameContainer.appendChild(legName);
            legNameContainer.appendChild(statusIcon);

            legNameContainer.style.display = "flex";
            legNameContainer.style.justifyContent = "space-between";
            legNameContainer.style.width = "400px";
            legNameContainer.classList.add("legNameContainer");
            const legOdds = document.createElement("div");
            legOdds.textContent = `${oddsArray[i]}`;
            legOdds.style.marginLeft = "0px";
            nameOdds.style.fontWeight = "bold";
            legOdds.style.marginLeft = "6px";
            nameOdds.appendChild(legNameContainer);
            nameOdds.appendChild(legOdds);

            const betCont = document.createElement("div");
            betCont.appendChild(nameOdds);
            betInfoDiv.style.fontSize = "12px";
            betInfoDiv.style.color = "rgb(36, 38, 41)";
            console.log("this is the betinfodiv", betInfoDiv.textContent);
            if (
              betInfoDiv.textContent.includes("Over") ||
              betInfoDiv.textContent.includes("Under")
            ) {
              betInfoDiv.style.display = "None";
            }
            betCont.appendChild(betInfoDiv);
            betCont.appendChild(gameDescription);
            betCont.style.marginBottom = "5px";
            parlayMiddle.style.fontFamily = "sans-serif";
            parlayMiddle.appendChild(betCont);
            parlayMiddle.style.marginLeft = "20px";
          }
          parlayMiddle.style.width = "437px";
          let amtwagered = bet.amtwagered;

          console.log("amtwagered", amtwagered);
          console.log("totalbetodds", totalOdds);
          let potentialReturn = parseFloat(amtwagered) * parseFloat(totalOdds);
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
          bottomRow.style.width = "437px";
          bottomRow.style.marginLeft = "20px";

          const cashOutContainer = document.createElement("div");
          cashOutContainer.style.width = "100%";
          cashOutContainer.style.display = "flex"; // Use Flexbox
          cashOutContainer.style.justifyContent = "center"; // Center horizontally
          cashOutContainer.style.alignItems = "center"; // Center vertically
          cashOutContainer.style.marginTop = "10px";
          cashOutContainer.style.height = "30px";
          const cashOutButton = document.createElement("button");
          cashOutButton.textContent = `$${totalReturn} Won on Cache!`;
          cashOutButton.style.fontWeight = "bold";
          cashOutButton.style.backgroundColor = "rgb(255, 220, 0)";
          cashOutButton.style.border = "none";
          cashOutButton.style.width = "437px";
          cashOutButton.style.borderRadius = "0px 0px 3px 3px";
          cashOutButton.style.backgroundColor = "#7F7D9C";
          cashOutButton.style.color = "white";
          cashOutButton.style.height = "30px";
          cashOutContainer.appendChild(cashOutButton);
          parlayMiddle.style.paddingBottom = "15px";
          parlayMiddle.style.borderBottom = "1px solid #7F7D9C";
          const parlayHeader = document.createElement("div");

          parlayHeader.style.marginBottom = "5px";
          parlayHeader.style.width = "437px";
          parlayHeader.style.border = "none";
          parlayHeader.style.display = "flex";
          parlayHeader.style.justifyContent = "space-between";

          parlayHeader.style.color = "black";
          parlayHeader.style.borderBottom = "1px solid #7F7D9C"; // Border only on the bottom
          // Optional background color
          parlayHeader.style.paddingBottom = "3px";

          const parlay = document.createElement("div");
          parlay.textContent = "Parlay";
          parlay.style.fontSize = "18px";
          parlay.style.fontWeight = "bold";
          parlay.style.fontFamily = "sans-serif";
          const parlayStatus = document.createElement("button");
          parlayStatus.textContent = `${resultStatus}`;
          parlayStatus.style.fontSize = "14px";
          parlayStatus.style.height = "30px";
          parlayHeader.style.paddingTop = "3px";
          parlayHeader.style.paddingBottom = "3px";
          parlayHeader.style.height = "40px";
          parlayHeader.style.alignItems = "center";
          parlayHeader.style.marginLeft = "20px";

          let betIdContainer = document.createElement("div");
          let betIdDiv = document.createElement("div");
          betIdDiv.textContent = `ID : ${betId} `;
          let timeSettledDiv = document.createElement("div");
          timeSettledDiv.textContent = `Settled: ${timeSettled}`;
          betIdContainer.style.marginLeft = "20px";
          betIdContainer.style.marginTop = "5px";
          betIdContainer.style.color = "rgb(36, 38, 41)";
          betIdContainer.style.fontSize = "13px";
          betIdContainer.style.paddingBottom = "45px";
          // Create the container for the left and right sections
          const container = document.createElement("div");
          container.style.display = "flex"; // Use flex layout
          container.style.justifyContent = "space-between"; // Space between left and right sections
          container.style.alignItems = "center"; // Vertically align items if needed
          container.style.width = "437px"; // Set width as needed
          container.style.marginLeft = "20px";

          const leftContainer = document.createElement("div");
          leftContainer.style.display = "block"; // Block layout for timeSettledDiv and betIdDiv
          leftContainer.style.alignItems = "flex-start"; // Align items to the left

          // Append timeSettledDiv and betIdDiv to the left container
          leftContainer.appendChild(timeSettledDiv);
          leftContainer.appendChild(betIdDiv);

          const rightContainer = document.createElement("div");
          rightContainer.style.display = "block"; // Block layout for the right content
          rightContainer.style.alignItems = "center"; // Center the item vertically

          rightContainer.appendChild(parlayStatus);
          container.appendChild(leftContainer);
          container.appendChild(rightContainer);
          betLink.style.clipPath =
            "polygon(0 0, 100% 0, 100% 90%, 95% 95%, 90% 90%, 85% 95%, 80% 90%, 75% 95%, 70% 90%, 65% 95%, 60% 90%, 55% 95%, 50% 90%, 45% 95%, 40% 90%, 35% 95%, 30% 90%, 25% 95%, 20% 90%, 15% 95%, 10% 90%, 5% 95%, 0 90%)";
          betIdContainer.appendChild(timeSettledDiv);
          betIdContainer.appendChild(betIdDiv);
          parlayHeader.appendChild(parlay);
          let oddsdiv = document.createElement("div");
          oddsdiv.textContent = `${totalOdds}`;
          oddsdiv.style.fontWeight = "bold";
          parlayHeader.appendChild(oddsdiv);
          //parlayHeader.appendChild(parlayStatus);
          betLink.appendChild(parlayHeader);

          betLink.appendChild(parlayMiddle);
          betLink.appendChild(bottomRow);
          betLink.appendChild(cashOutContainer);
          betLink.appendChild(betIdContainer);

          const odds = document.createElement("div");
          betLink.appendChild(odds);
          settledContainer.appendChild(betLink);
        }
      }
    });

    // Populate the settledContainer
    console.log("Settled Transactions:", settled);
    const betDiv = document.createElement("div");
    betDiv.textContent = `Settled Bet: ${JSON.stringify(settled)}`;
    settledContainer.appendChild(betDiv);
    settledContainer.style.backgroundColor = "lightblue";
    /*
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
    */

    // Initially show the unsettledContainer and hide the settledContainer
    transactionHistory.appendChild(unsettledContainer);
    transactionHistory.appendChild(settledContainer);
    unsettledContainer.style.display = "block";
    settledContainer.style.display = "none";

    // Add event listeners to the buttons
    // Add event listeners to the Open and Settled buttons
    Open.addEventListener("click", () => {
      // Hide all "settledContainer" elements
      document.querySelectorAll(".settled-container").forEach((container) => {
        container.style.display = "none";
      });

      // Show all "unsettled-container" elements
      document.querySelectorAll(".unsettled-container").forEach((container) => {
        container.style.display = "block";
      });
    });

    Settled.addEventListener("click", () => {
      // Hide all "unsettled-container" elements
      document.querySelectorAll(".unsettled-container").forEach((container) => {
        container.style.display = "none";
      });
      document.querySelectorAll(".settled-container").forEach((container) => {
        container.style.display = "block";
      });

      // Show all "settledContainer" elements
      document.querySelector("#unsettledContainer").style.display = "none";
      document.querySelector("#settledContainer").style.display = "block";
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
  }
}

export async function displayBetslips() {
  const betslips = await separateBetslips();
  console.log("User's Betslips:", betslips);
}
