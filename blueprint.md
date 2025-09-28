
# Project Blueprint

## Overview

This project is an Angular application that demonstrates how to integrate Firebase Authentication with a modern, standalone component architecture. It provides a simple and reusable component for handling Google Sign-In.

## Style, Design, and Features

### Implemented

*   **Architecture**: Fully standalone components, following the latest Angular best practices.
*   **State Management**: Utilizes Angular Signals for reactive state management.
*   **Control Flow**: Employs native `@` syntax for control flow in templates.
*   **Styling**: Modern CSS with a clean and simple design.

## Current Task: Google Authentication

### Plan

1.  **Install Firebase**: Add the `firebase` package to the project.
2.  **Generate `GoogleAuthComponent`**: Create a new standalone component to handle authentication.
3.  **Implement Component Logic**:
    *   Inject the Firebase Auth instance.
    *   Use `onAuthStateChanged` to create an observable for the user's authentication state.
    *   Implement `signInWithGoogle()` and `signOutUser()` methods.
4.  **Implement Component Template**:
    *   Conditionally render UI elements based on the authentication state.
    *   Include a "Sign In with Google" button.
    *   Display user information and a "Sign Out" button when authenticated.
5.  **Configure Firebase**: Set up the Firebase providers in the application's configuration.
6.  **Integrate Component**: Add the new component to the application's routes.
