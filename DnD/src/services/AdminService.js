import { db } from './firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

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
        alert("Seeding functionality has been disabled. Please upload content via the editors.");
        return true;
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
