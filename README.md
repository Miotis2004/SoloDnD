# Solo D&D Adventure 🎲⚔️

A single-player, web-based Dungeons & Dragons 5th Edition adventure game built with React, Firebase, and Tailwind CSS. Experience turn-based combat, interactive storytelling, character progression, and inventory management in a fully digital D&D experience.

![Solo D&D Adventure](https://img.shields.io/badge/Version-1.0.0-purple)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-11.0.2-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎮 Features

### **Character Management**
- **Character Creation** - Create characters with 6 unique classes (Fighter, Wizard, Rogue, Cleric, Ranger, Barbarian)
- **Point-Buy System** - Allocate 27 points across six ability scores (STR, DEX, CON, INT, WIS, CHA)
- **Multiple Characters** - Create and manage multiple characters per account
- **Class-Based Starting Equipment** - Each class receives appropriate starting gear
- **Auto-Save** - Progress automatically saves every 30 seconds and on logout

### **Combat System**
- **Turn-Based Combat** - D&D 5e rules-accurate combat mechanics
- **Initiative Rolls** - Roll d20 + DEX modifier to determine turn order
- **Attack & Damage Rolls** - Interactive dice rolling for attacks and damage
- **Enemy AI** - Automated enemy turns with intelligent attack patterns
- **HP Tracking** - Visual HP bars for all combatants
- **Victory/Defeat Outcomes** - Different story paths based on combat results

### **Inventory System**
- **Equipment Management** - Equip weapons and armor with stat bonuses
- **Consumables** - Use healing potions and other consumable items
- **Weight Tracking** - Carrying capacity based on Strength score (STR × 15 lbs)
- **Item Rarity** - Common, Uncommon, Rare, Very Rare, and Legendary items
- **Gold Currency** - Manage your character's wealth
- **Filtering** - Sort items by type (Weapon, Armor, Consumable, Misc)

### **Narrative Engine**
- **JSON-Driven Adventures** - Modular story system with branching paths
- **Skill Checks** - Roll d20 + modifier vs DC for success/failure outcomes
- **Interactive Choices** - Make decisions that affect the story
- **Adventure Log** - Complete history of your adventure with roll results
- **Multiple Endings** - Different outcomes based on your choices

### **Authentication & Data**
- **Firebase Authentication** - Secure user accounts with email/password
- **Cloud Firestore** - Persistent character and progress storage
- **Multi-User Support** - Each user has their own character collection
- **Password Recovery** - Built-in password reset functionality

### **User Interface**
- **Card-Based Layout** - Modular, expandable UI components
- **Dark Theme** - Immersive purple gradient design
- **Responsive Design** - Works on desktop and mobile devices
- **Visual Dice Tray** - Interactive dice rolling with animations
- **Real-Time Stats** - Live character sheet with calculated modifiers

---

## 📦 Tech Stack

- **Frontend**: React 18.3.1 + Vite 5.4.11
- **State Management**: Zustand 5.0.2
- **Styling**: Tailwind CSS 3.4.15
- **Animation**: Framer Motion 11.11.17
- **Icons**: Lucide React 0.460.0
- **Backend**: Firebase 11.0.2 (Auth + Firestore)
- **Build Tool**: Vite

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js (v22.21.0 or higher)
- npm (v10.9.4 or higher)
- Firebase account

### **Installation**

1. **Clone the repository**
```bash
   git clone <repository-url>
   cd dnd-app
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable **Email/Password Authentication**:
     - Go to Authentication → Sign-in method
     - Enable Email/Password provider
   - Create a **Firestore Database**:
     - Go to Firestore Database
     - Create database in production mode
     - Update security rules (see below)

4. **Configure environment variables**
   
   Create a `.env` file in the project root:
```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
```

5. **Update Firestore Security Rules**
   
   In Firebase Console → Firestore Database → Rules:
```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         match /characters/{characterId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
```

6. **Start the development server**
```bash
   npm run dev
```

7. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 🎯 Usage

### **Creating Your First Character**

1. **Register an account** or log in
2. Click **"Create New Character"**
3. Enter character name
4. Select a class:
   - **Fighter**: High HP (10), Heavy armor (AC 16)
   - **Wizard**: Low HP (6), Light armor (AC 12), spellcaster
   - **Rogue**: Medium HP (8), Medium armor (AC 14), finesse weapons
   - **Cleric**: Medium HP (8), Heavy armor (AC 15), divine magic
   - **Ranger**: Medium HP (10), Medium armor (AC 14), ranged weapons
   - **Barbarian**: High HP (12), Medium armor (AC 14), two-handed weapons
5. Allocate **27 points** across ability scores (8-18 range)
6. Review starting equipment
7. Click **"Create Character"**

### **Playing the Adventure**

1. **Read the narrative** in the Adventure Log
2. **Choose actions** from the Actions pane
3. **Roll dice** when prompted:
   - **Skill Checks**: d20 + modifier vs DC
   - **Initiative**: d20 + DEX modifier
   - **Attack Rolls**: d20 + STR/DEX modifier
   - **Damage Rolls**: Weapon damage die + modifier
4. **Manage inventory**:
   - Equip weapons/armor for stat bonuses
   - Use healing potions during or between combats
   - Track weight and gold
5. **Make choices** that affect the story outcome

### **Combat Flow**

1. **Combat Initiated** → Roll Initiative (d20)
2. **Your Turn**:
   - Click **"Attack"** button
   - Roll **d20** for attack (highlighted in Dice Tray)
   - If hit → Roll **damage die** based on equipped weapon
   - Enemy HP decreases
3. **Enemy Turn**: Automatic attack and damage
4. **Repeat** until victory or defeat
5. **Continue Story** based on outcome

---

## 📊 Game Data

The game includes extensive content databases:

- **92 Items**
  - 52 Weapons (clubs, swords, bows, etc.)
  - 14 Armor pieces (leather, chain mail, plate, shields)
  - 10 Consumables (healing potions, elixirs)
  - 16 Miscellaneous items (rope, torches, tools)

- **55 Spells**
  - 15 Cantrips (Fire Bolt, Mage Hand, etc.)
  - 40 Leveled spells (Fireball, Cure Wounds, etc.)
  - Schools: Evocation, Abjuration, Conjuration, and more

- **58 Monsters**
  - CR 0 to CR 21 creatures
  - Types: Beasts, Undead, Giants, Dragons, Aberrations
  - Includes classics: Goblins, Orcs, Trolls, Beholders, Dragons, Liches

---

## 📁 Project Structure
```
dnd-app/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth/              # Login, Register, Password Reset
│   │   ├── Character/         # Character creation & selection
│   │   ├── ActionPane.jsx     # Story choices & combat actions
│   │   ├── AdventureLog.jsx   # Narrative history display
│   │   ├── Card.jsx           # Reusable card wrapper
│   │   ├── CharacterSheet.jsx # Stats and modifiers display
│   │   ├── CombatActions.jsx  # Combat UI (enemies, actions)
│   │   ├── DiceTray.jsx       # Interactive dice roller
│   │   └── Inventory.jsx      # Item management UI
│   ├── contexts/
│   │   └── GameContext.jsx    # Global game state (combat & narrative)
│   ├── data/
│   │   ├── adventure.json     # Story nodes and encounters
│   │   ├── items.json         # Weapons, armor, consumables
│   │   ├── spells.json        # Spell database
│   │   └── monsters.json      # Creature stat blocks
│   ├── hooks/                 # Custom React hooks (deprecated)
│   ├── services/
│   │   ├── firebase.js        # Firebase configuration
│   │   └── characterService.js # Character CRUD operations
│   ├── store/
│   │   ├── authStore.js       # Authentication state (Zustand)
│   │   └── gameStore.js       # Game state (Zustand)
│   ├── App.jsx                # Main application component
│   ├── index.css              # Global styles + Tailwind
│   └── main.jsx               # React entry point
├── .env                       # Environment variables (not committed)
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🎨 Customization

### **Adding New Adventures**

Edit `src/data/adventure.json`:
```json
{
  "nodes": {
    "your_node_id": {
      "text": "Narrative text here",
      "type": "narrative",
      "choices": [
        {
          "label": "Choice text",
          "target": "next_node_id"
        },
        {
          "label": "Skill check choice",
          "check": {
            "stat": "str",
            "dc": 15,
            "success": "success_node_id",
            "failure": "failure_node_id"
          }
        }
      ]
    }
  }
}
```

### **Adding Combat Encounters**
```json
{
  "combat_node": {
    "text": "Combat description",
    "type": "combat",
    "enemies": [
      {
        "id": "enemy_1",
        "name": "Goblin",
        "hp": 7,
        "ac": 15,
        "attack": "+4",
        "damage": "1d6+2",
        "initiativeBonus": 2
      }
    ],
    "on_victory": "victory_node",
    "on_defeat": "defeat_node"
  }
}
```

### **Adding Items**

Edit `src/data/items.json` and add to the appropriate category.

### **Styling**

Modify `tailwind.config.js` or component-level classes to customize the theme.

---

## 🐛 Known Issues

- **Spell Casting**: Not yet implemented in combat
- **Character Leveling**: XP system planned for future release
- **Loot Drops**: Monsters don't drop items yet
- **Status Effects**: Buffs/debuffs system in development

---

## 🗺️ Roadmap

### **Version 1.1** (Planned)
- [ ] Spell casting in combat
- [ ] Loot system (enemy drops, treasure chests)
- [ ] Character leveling and XP
- [ ] More combat actions (Defend, Disengage, Dash)

### **Version 1.2** (Planned)
- [ ] Status effects (Poisoned, Stunned, Blessed)
- [ ] Rest system (Short rest, Long rest)
- [ ] Merchant/shop system
- [ ] Multiple campaigns

### **Version 2.0** (Future)
- [ ] Multiplayer support
- [ ] Custom character portraits
- [ ] Sound effects and music
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Dungeons & Dragons** - Game mechanics and inspiration from D&D 5th Edition
- **Wizards of the Coast** - For creating the world's greatest roleplaying game
- **Tailwind CSS** - For the amazing utility-first CSS framework
- **Firebase** - For backend infrastructure
- **Lucide** - For beautiful open-source icons

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

## 🎲 Happy Adventuring!

May your rolls be high and your adventures legendary! ⚔️✨

---

**Built with ❤️ by D&D enthusiasts, for D&D enthusiasts**