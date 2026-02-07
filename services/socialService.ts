
import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { UserData } from './syncService';

export const SocialService = {
    /**
     * Search for a user by email and return their simplified profile if found.
     * Note: In a real app, we would use a dedicated 'usernames' collection or cloud function
     * to avoid querying the whole users collection if it's large.
     */
    findUserByEmail: async (email: string) => {
        if (!db) return null;
        try {
            const usersRef = collection(db, "users");
            // NOTE: Firestore requires an index for this query in production.
            // For small scale/demo, this works if 'profile.email' exists.
            // Since UserProfile structure is nested in the 'profile' field of the doc:
            const q = query(usersRef, where("profile.email", "==", email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                const data = docSnap.data() as UserData;
                return {
                    uid: docSnap.id,
                    name: data.profile.name,
                    email: data.profile.email
                };
            }
        } catch (e) {
            console.error("Error finding user:", e);
        }
        return null;
    },

    /**
     * Link two users as partners.
     */
    linkPartners: async (currentUserId: string, partnerId: string, partnerName: string, partnerEmail: string) => {
        if (!db) return false;
        try {
            const myRef = doc(db, "users", currentUserId);
            
            // Update my profile
            await updateDoc(myRef, {
                "profile.social": {
                    partnerId,
                    partnerName,
                    partnerEmail
                }
            });
            
            // Optionally, we could update the partner's profile too to make it mutual automatically,
            // but for "Asymmetric" accountability (Sponsorship), maybe only I watch them or vice versa.
            // Let's stick to simple linking for now.
            return true;
        } catch (e) {
            console.error("Error linking partners:", e);
            return false;
        }
    },

    /**
     * Check partner's progress for YESTERDAY.
     * Returns a status message key ('fail' or 'success') or null.
     */
    checkPartnerStatus: async (partnerId: string): Promise<'fail' | 'success' | null> => {
        if (!db) return null;
        try {
            const partnerRef = doc(db, "users", partnerId);
            const docSnap = await getDoc(partnerRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data() as UserData;
                
                // Calculate yesterday's date string using LOCAL TIME
                const now = new Date();
                now.setDate(now.getDate() - 1);
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const yesterdayStr = `${year}-${month}-${day}`;

                const waterGoal = data.profile.waterGlasses || 8;
                let waterDrank = 0;

                // Check water log
                if (data.waterLog && data.waterLog.date === yesterdayStr) {
                    waterDrank = data.waterLog.count;
                }

                // Logic: Did they fail water?
                if (waterDrank < waterGoal) {
                    return 'fail';
                } else {
                    return 'success';
                }
            }
        } catch (e) {
            console.error("Error checking partner:", e);
        }
        return null;
    }
};
