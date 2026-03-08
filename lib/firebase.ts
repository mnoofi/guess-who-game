import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyAjRRGfzTqAMkYsDjAdCV595Xeq2f10sy8",
  authDomain: "guess-who-game-7e0aa.firebaseapp.com",
  projectId: "guess-who-game-7e0aa",
  storageBucket: "guess-who-game-7e0aa.firebasestorage.app",
  messagingSenderId: "557291306602",
  appId: "1:557291306602:web:9de1db18004d7d4b41d413",
  databaseURL: "https://guess-who-game-7e0aa-default-rtdb.firebaseio.com"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getDatabase(app)