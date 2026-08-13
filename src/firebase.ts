import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDBuikoZ-rywAa_zkr1NVjBj5xsLE7jqY0",
    authDomain: "timecard-tracker-6c418.firebaseapp.com",
    projectId: "timecard-tracker-6c418",
    storageBucket: "timecard-tracker-6c418.firebasestorage.app",
    messagingSenderId: "1029145605438",
    appId: "1:1029145605438:web:55f6b0cf170033c9d2e86f"
};

// Initialize Firebase & Database
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);