import { db } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import itemsData from '../data/items.json';
import monstersData from '../data/monsters.json';
import spellsData from '../data/spells.json';
import adventureData from '../data/adventure.json';

const COLLECTIONS = {
    ITEMS: 'content_items',
    MONSTERS: 'content_monsters',
    SPELLS: 'content_spells',
    ADVENTURES: 'content_adventures',
    CAMPAIGNS: 'content_campaigns'
};

export const AdminService = {
    // Seed Logic
    seedDatabase: async () => {
        try {
            const batch = writeBatch(db);

            // Seed Items
            // Items are nested categories in JSON. Flatten them or keep structure?
            // Let's store individual items as docs for easier editing.
            Object.values(itemsData).forEach(category => {
                Object.values(category).forEach(item => {
                    const ref = doc(db, COLLECTIONS.ITEMS, item.name.toLowerCase().replace(/\s+/g, '_')); // simplistic ID
                    batch.set(ref, item);
                });
            });

            // Seed Monsters
            // Monsters are nested by CR.
            Object.values(monstersData).forEach(crGroup => {
                Object.entries(crGroup).forEach(([id, monster]) => {
                    const ref = doc(db, COLLECTIONS.MONSTERS, id);
                    batch.set(ref, { ...monster, id });
                });
            });

            // Seed Spells
            Object.values(spellsData).forEach(levelGroup => {
                Object.entries(levelGroup).forEach(([id, spell]) => {
                    const ref = doc(db, COLLECTIONS.SPELLS, id);
                    batch.set(ref, { ...spell, id });
                });
            });

            // Seed Demo Adventure
            const advRef = doc(db, COLLECTIONS.ADVENTURES, adventureData.id);
            batch.set(advRef, adventureData);

            await batch.commit();
            console.log("Database seeded successfully.");
            return true;
        } catch (error) {
            console.error("Error seeding database:", error);
            return false;
        }
    },

    // Fetch Content
    getAllContent: async (collectionName) => {
        const snap = await getDocs(collection(db, collectionName));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Save Content
    saveContent: async (collectionName, id, data) => {
        await setDoc(doc(db, collectionName, id), data);
    },

    COLLECTIONS
};
