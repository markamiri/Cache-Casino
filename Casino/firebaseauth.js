import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
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

function signUpfnc() {
  const signUp = document.getElementById("submitSignUp");
  signUp.addEventListener("click", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const firstName = document.getElementById("fName").value;
    const lastName = document.getElementById("lName").value;
    const userName = document.getElementById("uName").value;

    const auth = getAuth();
    const db = getFirestore();

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
          email: email,
          firstName: firstName,
          lastName: lastName,
          username: userName,
          balance: 500,
        };

        // Store the user's UID in local storage
        localStorage.setItem("loggedInUserId", user.uid);

        showMessage("Account Created Successfully", "signUpMessage");

        const docRef = doc(db, "users", user.uid);
        setDoc(docRef, userData)
          .then(() => {
            console.log("User data saved to Firestore");
            window.location.href = "ham-menu.html";
          })
          .catch((error) => {
            console.error("Firestore error:", error);
            showMessage("Unable to create user in Firestore", "signUpMessage");
          });
      })
      .catch((error) => {
        console.error("Error creating user:", error);
        showMessage("Error creating user", "signUpMessage");
      });
  });
}

function signInFnc() {
  const signIn = document.getElementById("submitSignIn");
  signIn.addEventListener("click", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const auth = getAuth();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        showMessage("Login is successful", "signInMessage");
        const user = userCredential.user;
        localStorage.setItem("loggedInUserId", user.uid);
        window.location.href = "ham-menu.html";
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === "auth/invalid-credential") {
          showMessage("Incorrect Email or Password", "signInMessage");
        } else {
          showMessage("Account does not Exist", "signInMessage");
        }
      });
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
