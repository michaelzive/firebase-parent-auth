import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { routes } from './app.routes';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcbyM-ri65U77DJoLvQiL5RB_zbmF04bs",
  authDomain: "parent-authentication-c620f.firebaseapp.com",
  projectId: "parent-authentication-c620f",
  storageBucket: "parent-authentication-c620f.firebasestorage.app",
  messagingSenderId: "565848616619", // <-- Get this from Firebase Console
  appId: "1:565848616619:web:5cebac7b8e16f6809751ee",
  measurementId: "G-2Q7L5ERBR9"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => {
      const app = inject(FirebaseApp);
      return getAuth(app);
    })
  ]
};
