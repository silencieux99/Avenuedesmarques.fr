import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export const getHeroSlides = async () => {
    try {
        const q = query(collection(db, "hero_slides"), orderBy('rank', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching hero slides:", error);
        return [];
    }
};
