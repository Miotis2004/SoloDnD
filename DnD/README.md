# Single Player D&D 5e Web App

A modular, single-player Dungeons & Dragons 5th Edition game engine built with React, Vite, and Firebase.

## Features

*   **Modular Interface:** Draggable/Zoomable cards for Character, Log, Actions, and Dice.
*   **Narrative Engine:** JSON-driven adventure modules with branching paths and skill checks.
*   **D&D 5e Mechanics:** 
    *   Dice Roller (d4, d6, d8, d10, d12, d20).
    *   Character Sheet (Stats, HP, AC, Initiative).
    *   Combat vs Narrative modes.
*   **Dark Mode UI:** Immersive dark fantasy aesthetic.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Firebase:**
    Create a `.env` file in the root directory with your Firebase credentials:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
    *Note: If keys are missing, the app defaults to a "Mock Mode" for development.*

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## Adventure Modules (JSON Schema)

Adventures are stored in `src/data/adventure.json`.

```json
{
  "id": "adventure-id",
  "start_node": "intro",
  "nodes": {
    "node_id": {
      "text": "Narrative text to display.",
      "type": "narrative", // or "combat"
      "choices": [
        {
          "label": "Action Text",
          "target": "next_node_id",
          "check": { 
             "stat": "str", 
             "dc": 15, 
             "success": "success_node", 
             "failure": "fail_node" 
          }
        }
      ]
    }
  }
}
```

## Tech Stack

*   **Frontend:** React (Vite)
*   **Styling:** Tailwind CSS, Framer Motion
*   **State:** Zustand
*   **Backend:** Firebase (Auth, Firestore)
