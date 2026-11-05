import {
    initializeApp,
    getApps,
    getApp
  } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
  
  import {
    getAuth
  } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
  
  import {
    getFirestore
  } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
  
  const firebaseConfig = {
    apiKey: "AIzaSyBLnN7msFRQ0E-OIXRp9Ci3NkkYB0CAVRs",
    authDomain: "formati-22ce1.firebaseapp.com",
    projectId: "formati-22ce1",
    storageBucket: "formati-22ce1.firebasestorage.app",
    messagingSenderId: "370835149741",
    appId: "1:370835149741:web:97f309681243c68dd30724",
    measurementId: "G-NZPJKGNZEX"
  };
  
  export const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
  
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  
