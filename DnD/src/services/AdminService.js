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
            // Helper to chunk batches (Firestore limit is 500 ops per batch)
            const batches = [];
            let currentBatch = writeBatch(db);
            let opCount = 0;

            const addOp = (ref, data) => {
                currentBatch.set(ref, data);
                opCount++;
                if (opCount >= 450) { // Safety buffer below 500
                    batches.push(currentBatch);
                    currentBatch = writeBatch(db);
                    opCount = 0;
                }
            };

            // Seed Items
            let itemCount = 0;
            Object.values(itemsData).forEach(category => {
                Object.values(category).forEach(item => {
                    const ref = doc(db, COLLECTIONS.ITEMS, item.name.toLowerCase().replace(/\s+/g, '_'));
                    addOp(ref, item);
                    itemCount++;
                });
            });
            console.log(`Prepared ${itemCount} items.`);

            // Seed Monsters
            let monsterCount = 0;
            Object.values(monstersData).forEach(crGroup => {
                Object.entries(crGroup).forEach(([id, monster]) => {
                    const ref = doc(db, COLLECTIONS.MONSTERS, id);
                    addOp(ref, { ...monster, id });
                    monsterCount++;
                });
            });
            console.log(`Prepared ${monsterCount} monsters.`);

            // Seed Spells
            let spellCount = 0;
            Object.values(spellsData).forEach(levelGroup => {
                Object.entries(levelGroup).forEach(([id, spell]) => {
                    const ref = doc(db, COLLECTIONS.SPELLS, id);
                    addOp(ref, { ...spell, id });
                    spellCount++;
                });
            });
            console.log(`Prepared ${spellCount} spells.`);

            // Seed Demo Adventure
            const advRef = doc(db, COLLECTIONS.ADVENTURES, adventureData.id);
            addOp(advRef, adventureData);

            // Push final batch
            if (opCount > 0) batches.push(currentBatch);

            console.log(`Committing ${batches.length} batches...`);

            // Execute all batches
            await Promise.all(batches.map(b => b.commit()));

            console.log("Database seeded successfully.");
            return true;
        } catch (error) {
            console.error("Error seeding database:", error);
            // Throw error so UI can catch it
            throw error;
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
