
import { db } from './firebase';
import { UserProfile, HistoryItem, ExerciseLog } from '../types';
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

// Structure of the data stored in Firestore
export interface UserData {
    profile: UserProfile;
    history: HistoryItem[];
    exerciseHistory: ExerciseLog[];
    waterLog: { date: string; count: number };
    lastUpdated: number;
}

export const SyncService = {
    /**
     * Suscribe a los cambios en tiempo real de la base de datos.
     * Cuando otro dispositivo cambie algo, esta función se ejecutará automáticamente.
     */
    subscribeToUserData: (userId: string, onUpdate: (data: UserData) => void) => {
        if (!db) return () => {}; 

        // Modular syntax
        const userDocRef = doc(db, "users", userId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as UserData;
                onUpdate(data);
            }
        });

        return unsubscribe;
    },

    /**
     * Guarda todo el estado del usuario en la nube.
     */
    saveUserData: async (userId: string, data: Partial<UserData>) => {
        if (!db) return;

        try {
            // Modular syntax
            const userDocRef = doc(db, "users", userId);
            
            // SECURITY: If history is too long, slice it to last 20 items to fit in 1MB document limit
            // Local storage keeps full history, cloud keeps recent sync
            const payload = { ...data };
            if (payload.history && payload.history.length > 20) {
                payload.history = payload.history.slice(0, 20);
            }

            await setDoc(userDocRef, {
                ...payload,
                lastUpdated: Date.now()
            }, { merge: true });
        } catch (e: any) {
            console.error("Error guardando en la nube:", e);
            if (e.code === 'resource-exhausted' || e.message.includes('exceeds the maximum size')) {
                console.error("ALERT: Document exceeded 1MB limit. History might be too large.");
                // In a real app, this should trigger a UI toast warning the user.
            }
        }
    },

    /**
     * Carga inicial para verificar si existe usuario
     */
    getUserData: async (userId: string): Promise<UserData | null> => {
        if (!db) return null;
        try {
            // Modular syntax
            const userDocRef = doc(db, "users", userId);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                return docSnap.data() as UserData;
            }
        } catch (e) {
            console.error("Error obteniendo datos:", e);
        }
        return null;
    }
};
