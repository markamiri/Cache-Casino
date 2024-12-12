import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjl0DH8mQxyDvtHj5XO37lHFUpv5FE61E",
  authDomain: "fir-v10-5e04f.firebaseapp.com",
  databaseURL: "https://fir-v10-5e04f-default-rtdb.firebaseio.com",
  projectId: "fir-v10-5e04f",
  storageBucket: "fir-v10-5e04f.appspot.com",
  messagingSenderId: "539121343265",
  appId: "1:539121343265:web:0972f1e127abab931efc60",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Function to show messages
function showMessage(message, elementId) {
  const messageDiv = document.getElementById(elementId);
  messageDiv.textContent = message; // Set the message
  messageDiv.style.display = "block"; // Make it visible
  setTimeout(() => {
    messageDiv.style.display = "none"; // Hide after 3 seconds
  }, 3000);
}

function signInFnc() {
  const signIn = document.getElementById("submitSignIn");
  signIn.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store the user's UID in local storage
      localStorage.setItem("loggedInUserId", user.uid);
      showMessage("Login is successful", "signInMessage");

      // Redirect to the user's dashboard or home page
      window.location.href = "ham-menu.html";
    } catch (error) {
      console.error("Error signing in: ", error);
      const errorCode = error.code;

      if (errorCode === "auth/invalid-credential") {
        showMessage("Incorrect Email or Password", "signInMessage");
      } else if (errorCode === "auth/user-not-found") {
        showMessage("User does not exist. Please sign up.", "signInMessage");
      } else {
        showMessage("Error signing in: " + error.message, "signInMessage");
      }
    }
  });
}

function signUpfnc() {
  const signUp = document.getElementById("submitSignUp");
  signUp.addEventListener("click", async (event) => {
    // Add async here
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const firstName = document.getElementById("fName").value;
    const lastName = document.getElementById("lName").value;
    const userName = document.getElementById("uName").value;

    const auth = getAuth();
    const db = getFirestore();
    const rtdb = getDatabase();

    try {
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // User data for Firestore
      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        username: userName,
        balance: 500, // Fixed typo "balacne"
      };

      // Store the user's UID in local storage
      localStorage.setItem("loggedInUserId", user.uid);
      showMessage("Account created successfully", "signUpMessage");

      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), userData);
      console.log("User data saved to Firestore");

      // Save initial balance to Realtime Database
      const userFolderRef = ref(rtdb, `betslipSet/${userName}`);
      const balanceData = {
        balance: 500,
        betslips: {},
      };
      await set(userFolderRef, balanceData);
      console.log("User data saved to Realtime Database");

      // Redirect to another page
      window.location.href = "ham-menu.html";
    } catch (error) {
      console.error("Error: ", error);
      showMessage("Error creating user: " + error.message, "signUpMessage");
    }
  });
}

// Detect the current page and call the appropriate function
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.includes("signup.html")) {
    signUpfnc();
  } else if (path.includes("signin.html")) {
    signInFnc();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logoutButton");
  const loggedIn = localStorage.getItem("loggedInUserId");
  const withdraw = document.getElementById("withdraw");
  const deposit = document.getElementById("deposit");

  if (loggedIn) {
    logoutButton.addEventListener("click", signOutFnc);
  } else if (!loggedIn) {
    logoutButton.addEventListener("click", redirectSignIn);
    withdraw.addEventListener("click", redirectSignIn);
    deposit.addEventListener("click", redirectSignUp);
  } else {
    console.warn("Logout button not found in the DOM.");
  }
});

function redirectSignIn() {
  window.location.href = "temp-signin.html";
}

function redirectSignUp() {
  window.location.href = "temp-signup.html";
}
function signOutFnc() {
  const auth = getAuth();
  signOut(auth)
    .then(() => {
      //showMessage("Successfully signed out", "signOutMessage");

      localStorage.removeItem("loggedInUserId"); // Clear user ID from localStorage

      window.location.href = "temp-signin.html"; // Redirect to the login page or home page
    })
    .catch((error) => {
      //showMessage("Error signing out: " + error.message, "signOutMessage");
    });
}
