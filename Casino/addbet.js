import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

let user = document.querySelector("#user");
let betName = document.querySelector("#betName");
let odds = document.querySelector("#odds");
let wagered = document.querySelector("#wagered");
let transnumb = document.querySelector("#transnumb");

// Function to add data
export function AddData() {
  const userId = user.value;
  const wageredAmount = parseFloat(wagered.value); // Convert wagered input to a number

  // Fetch the user's transaction history to determine the next transaction number
  const userRef = ref(db, "betslipSet/" + userId);

  get(userRef)
    .then((snapshot) => {
      let currentBalance = 500; // Default balance for first transaction
      let nextTransactionNumber = 1; // Default transaction number if this is the user's first transaction

      if (snapshot.exists()) {
        // Retrieve all transactions and determine the latest transaction number
        const allTransactions = snapshot.val();
        const transactionKeys = Object.keys(allTransactions);

        // Find the highest transaction number and increment it
        nextTransactionNumber = transactionKeys.length + 1;

        // Get the latest balance from the latest transaction
        const latestTransaction =
          allTransactions[transactionKeys[transactionKeys.length - 1]];
        currentBalance = latestTransaction.balance;
      }

      // Check if the wagered amount is less than or equal to the current balance
      if (wageredAmount > currentBalance) {
        alert(
          "Insufficient funds. Your current balance is: $" + currentBalance
        );
      } else {
        // Subtract wagered amount from balance and create the new bet data
        const newBalance = currentBalance - wageredAmount;

        const betData = {
          name: userId,
          nameofbet: betName.value,
          betodds: odds.value,
          amtwagered: wageredAmount,
          transaction: nextTransactionNumber, // Set the transaction number automatically
          unsettled: true,
          cache: "None",
          totalreturn: 0,
          balance: newBalance, // Update balance after wager
          cashout: false,
        };

        // Store data under user and transaction number in Realtime Database
        set(
          ref(db, "betslipSet/" + userId + "/" + nextTransactionNumber),
          betData
        )
          .then(() => {
            alert("Bet added successfully. New balance is: $" + newBalance);

            // Update balance in Firestore
            const loggedInUserId = localStorage.getItem("loggedInUserId");

            const userDocRef = doc(firestore, "users", loggedInUserId);

            return updateDoc(userDocRef, { balance: newBalance });
          })
          .then(() => {
            alert("Balance updated successfully in Firestore.");
          })
          .catch((error) => {
            alert("Error updating Firestore: " + error);
          });
      }
    })
    .catch((error) => {
      alert("Error retrieving user data: " + error);
    });
}

export function AddParlayData(legs) {
  const userId = user.value;
  const wageredAmount = parseFloat(wagered.value); // Convert wagered input to a number

  // Reference to user's transaction history
  const userRef = ref(db, "betslipSet/" + userId);

  get(userRef)
    .then((snapshot) => {
      let currentBalance = 500; // Default balance if first transaction
      let nextTransactionNumber = 1; // Default transaction number if first transaction

      if (snapshot.exists()) {
        const allTransactions = snapshot.val();
        const transactionKeys = Object.keys(allTransactions);

        // Determine the next transaction number
        nextTransactionNumber = transactionKeys.length + 1;

        // Get the balance from the last transaction
        const latestTransaction =
          allTransactions[transactionKeys[transactionKeys.length - 1]];
        currentBalance = latestTransaction.balance;
      }

      // Check if the wagered amount is less than or equal to the current balance
      if (wageredAmount > currentBalance) {
        alert(
          "Insufficient funds. Your current balance is: $" + currentBalance
        );
      } else {
        // Subtract wagered amount from balance
        const newBalance = currentBalance - wageredAmount;

        // Create parlay bet data
        const betData = {
          name: userId,
          nameofbet: legs.map((leg, index) => ({
            legNumber: index + 1,
            description: leg.description,
            odds: leg.odds,
            outcome: "Pending", // Set initial outcome for each leg
          })),
          isParlay: true, // Mark this as a parlay bet
          amtwagered: wageredAmount,
          transaction: nextTransactionNumber,
          unsettled: true,
          cache: "None",
          totalreturn: 0,
          balance: newBalance, // Update balance after wager
          cashout: false,
        };

        // Store parlay data in Realtime Database under user and transaction number
        set(
          ref(db, "betslipSet/" + userId + "/" + nextTransactionNumber),
          betData
        )
          .then(() => {
            alert(
              "Parlay bet added successfully. New balance is: $" + newBalance
            );

            // Update balance in Firestore
            const loggedInUserId = localStorage.getItem("loggedInUserId");
            const userDocRef = doc(firestore, "users", loggedInUserId);

            return updateDoc(userDocRef, { balance: newBalance });
          })
          .then(() => {
            alert("Balance updated successfully in Firestore.");
          })
          .catch((error) => {
            alert("Error updating Firestore: " + error);
          });
      }
    })
    .catch((error) => {
      alert("Error retrieving user data: " + error);
    });
}
