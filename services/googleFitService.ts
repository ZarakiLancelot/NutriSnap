
import { NutritionAnalysis, ExerciseLog } from "../types";

// Declare global types for Google Identity Services to appease TypeScript
declare global {
  interface Window {
    google: any;
  }
}

// Scopes required for reading/writing data to Google Fit
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.write",
  "https://www.googleapis.com/auth/fitness.body.write",
  "https://www.googleapis.com/auth/fitness.nutrition.write",
  "https://www.googleapis.com/auth/fitness.activity.read", 
  "https://www.googleapis.com/auth/fitness.sleep.read"
].join(" ");

interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

export const GoogleFitService = {
  tokenClient: null as any,
  accessToken: null as string | null,
  
  // Use the same Client ID as LoginScreen for consistency
  CLIENT_ID: "738932582742-qtejr7a73iudphk38ck9qfv4gvmfl44u.apps.googleusercontent.com",

  /**
   * Check if the Google Identity Services script is loaded
   */
  isScriptLoaded: () => {
      return typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.oauth2;
  },

  /**
   * Initialize the Google Identity Services Token Client
   */
  init: () => {
    if (GoogleFitService.isScriptLoaded()) {
      GoogleFitService.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GoogleFitService.CLIENT_ID, 
        scope: SCOPES,
        callback: (tokenResponse: TokenResponse) => {
          if (tokenResponse.access_token) {
            GoogleFitService.accessToken = tokenResponse.access_token;
            sessionStorage.setItem("google_fit_token", tokenResponse.access_token);
            console.log("Google Fit Token Received");
          }
        },
      });
      return true;
    }
    return false;
  },

  isTokenAvailable: () => {
      const token = GoogleFitService.accessToken || sessionStorage.getItem("google_fit_token");
      return !!token;
  },

  /**
   * Trigger the popup to request permission with enhanced error handling
   */
  connect: (): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      // Try to init if not ready
      if (!GoogleFitService.tokenClient) {
        const initialized = GoogleFitService.init();
        if (!initialized) {
            resolve({ success: false, error: "Google Identity Services script not loaded yet. Try again in a moment." });
            return;
        }
      }

      // Hook into the callback to resolve the promise logic
      const originalCallback = GoogleFitService.tokenClient.callback;
      
      GoogleFitService.tokenClient.callback = (resp: any) => {
          if (resp.error) {
              console.error("Google Fit Auth Error:", resp);
              let errorMessage = resp.error;
              if (resp.error === 'access_denied') {
                  errorMessage = "Access Denied. Please approve permissions to sync data.";
              } else if (resp.error === 'popup_closed_by_user') {
                  errorMessage = "Login popup closed.";
              }
              resolve({ success: false, error: errorMessage });
          } else if (resp.access_token) {
              GoogleFitService.accessToken = resp.access_token;
              sessionStorage.setItem("google_fit_token", resp.access_token);
              resolve({ success: true });
          }
      };

      try {
        // Only request if user explicitly interacts, to avoid browser popup blockers
        GoogleFitService.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (e: any) {
        resolve({ success: false, error: e.message || "Failed to request access token." });
      }
    });
  },

  /**
   * Helper to perform authenticated fetch
   */
  authenticatedFetch: async (url: string, method: string, body: any) => {
    let token = GoogleFitService.accessToken || sessionStorage.getItem("google_fit_token");
    
    if (!token) {
       throw new Error("NO_TOKEN");
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      if (response.status === 401) {
          sessionStorage.removeItem("google_fit_token");
          GoogleFitService.accessToken = null;
          throw new Error("UNAUTHORIZED");
      }

      if (!response.ok) {
          const err = await response.text();
          console.error("Google Fit API Error:", err);
          return null; 
      }
      return await response.json();
    } catch (e: any) {
      if (e.message === 'NO_TOKEN' || e.message === 'UNAUTHORIZED') {
          throw e; 
      }
      console.error("Google Fit Network Error:", e);
      return null;
    }
  },

  /**
   * Get total steps for the current day
   */
  getDailySteps: async (): Promise<number> => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfDay = now.getTime();

      const url = `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`;
      const body = {
          aggregateBy: [{
              dataTypeName: "com.google.step_count.delta",
              dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
          }],
          bucketByTime: { durationMillis: endOfDay - startOfDay },
          startTimeMillis: startOfDay,
          endTimeMillis: endOfDay
      };

      const data = await GoogleFitService.authenticatedFetch(url, 'POST', body);
      
      if (data && data.bucket && data.bucket.length > 0) {
          const bucket = data.bucket[0];
          if (bucket.dataset && bucket.dataset.length > 0) {
              const point = bucket.dataset[0].point;
              if (point && point.length > 0) {
                  return point[0].value[0].intVal || 0;
              }
          }
      }
      return 0;
  },

  /**
   * Get sleep duration in hours for the previous night.
   * IMPROVED: Uses dataset:aggregate on 'com.google.sleep.segment' to catch auto-detected sleep.
   */
  getSleepSession: async (): Promise<number> => {
      const now = new Date();
      
      // Window: Yesterday 12:00 PM to Today 12:00 PM (24h window centered on the night)
      // This ensures we catch the sleep session regardless of whether it started before or after midnight.
      const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime();
      const yesterdayNoon = todayNoon - (24 * 60 * 60 * 1000);
      
      // Limit end time to now to avoid future queries if it's morning
      const endTime = Math.min(Date.now(), todayNoon + (2 * 60 * 60 * 1000));

      const url = `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`;
      const body = {
          aggregateBy: [{
              dataTypeName: "com.google.sleep.segment"
          }],
          // Just one big bucket for the whole duration
          bucketByTime: { durationMillis: endTime - yesterdayNoon }, 
          startTimeMillis: yesterdayNoon,
          endTimeMillis: endTime
      };

      try {
          const data = await GoogleFitService.authenticatedFetch(url, 'POST', body);
          
          if (data && data.bucket && data.bucket.length > 0) {
              const dataset = data.bucket[0].dataset[0];
              if (dataset.point && dataset.point.length > 0) {
                  let totalSleepMs = 0;
                  
                  dataset.point.forEach((p: any) => {
                      // Sleep Stage Types in Google Fit:
                      // 1: Awake (during sleep cycle)
                      // 2: Sleep (Generic)
                      // 3: Out-of-bed
                      // 4: Light sleep
                      // 5: Deep sleep
                      // 6: REM
                      const stage = p.value[0].intVal;
                      
                      // Filter out "Awake" (1) and "Out-of-bed" (3)
                      // We count 2, 4, 5, 6
                      if (stage !== 1 && stage !== 3) {
                          const start = parseInt(p.startTimeNanos);
                          const end = parseInt(p.endTimeNanos);
                          totalSleepMs += (end - start) / 1000000; // Convert nanos to ms
                      }
                  });

                  // Convert to hours with 1 decimal place
                  return Math.round((totalSleepMs / (1000 * 60 * 60)) * 10) / 10;
              }
          }
      } catch (e) {
          console.error("Error fetching sleep aggregation:", e);
      }
      
      // FALLBACK: Try the old sessions method if aggregation failed or returned 0
      // Sometimes manual entries only exist as sessions
      try {
          const sessionsUrl = `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(yesterdayNoon).toISOString()}&endTime=${new Date(endTime).toISOString()}&activityType=72`; 
          const sessionData = await GoogleFitService.authenticatedFetch(sessionsUrl, 'GET', null);
          
          if (sessionData && sessionData.session && sessionData.session.length > 0) {
              let totalMs = 0;
              sessionData.session.forEach((s: any) => {
                  totalMs += (parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis));
              });
              console.log("Fallback to session data for sleep.");
              return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
          }
      } catch (e) {
          console.error("Fallback sleep session fetch failed", e);
      }

      return 0;
  },

  /**
   * Sync Weight Data (Write)
   */
  syncWeight: async (weightKg: number) => {
    try {
        const startTimeNs = Date.now() * 1000000;
        const endTimeNs = startTimeNs;
        
        const datasetId = `${startTimeNs}-${endTimeNs}`;
        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.weight:com.google.android.gms:merge_weight/datasets/${datasetId}`;

        const body = {
        dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight",
        maxEndTimeNs: endTimeNs,
        minStartTimeNs: startTimeNs,
        point: [
            {
            dataTypeName: "com.google.weight",
            startTimeNanos: startTimeNs,
            endTimeNanos: endTimeNs,
            value: [{ fpVal: weightKg }]
            }
        ]
        };

        await GoogleFitService.authenticatedFetch(url, 'PATCH', body);
    } catch (e) {
        console.error("Sync weight failed", e);
    }
  },

  /**
   * Sync Nutrition Data (Write)
   */
  syncNutrition: async (foodItem: NutritionAnalysis) => {
    try {
        const startTimeNs = Date.now() * 1000000;
        const endTimeNs = startTimeNs;
        const datasetId = `${startTimeNs}-${endTimeNs}`;
        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.nutrition:com.google.android.gms:merge_nutrition/datasets/${datasetId}`;

        const nutrients = [
        { key: "calories", value: { fpVal: foodItem.calorias.total } },
        { key: "protein", value: { fpVal: foodItem.macros.proteina_g } },
        { key: "fat.total", value: { fpVal: foodItem.macros.grasas_g } },
        { key: "carbs.total", value: { fpVal: foodItem.macros.carbohidratos_g } },
        { key: "dietary_fiber", value: { fpVal: foodItem.macros.fibra_g } },
        ];

        const body = {
        dataSourceId: "derived:com.google.nutrition:com.google.android.gms:merge_nutrition",
        maxEndTimeNs: endTimeNs,
        minStartTimeNs: startTimeNs,
        point: [
            {
            dataTypeName: "com.google.nutrition",
            startTimeNanos: startTimeNs,
            endTimeNanos: endTimeNs,
            value: [
                {
                mapVal: nutrients
                },
                { intVal: 3 } 
            ]
            }
        ]
        };

        await GoogleFitService.authenticatedFetch(url, 'PATCH', body);
    } catch (e) {
        console.error("Sync nutrition failed", e);
    }
  },

  /**
   * Sync Exercise Data (Write)
   */
  syncExercise: async (exerciseLog: ExerciseLog) => {
    try {
        let activityId = 7; // Walking
        const type = exerciseLog.type.toLowerCase();
        
        if (type.includes('correr')) activityId = 8;
        if (type.includes('ciclismo')) activityId = 1;
        if (type.includes('natación')) activityId = 82;
        if (type.includes('pesas') || type.includes('gimnasio')) activityId = 97;
        if (type.includes('yoga')) activityId = 100;
        if (type.includes('futbol')) activityId = 25;

        const durationMs = exerciseLog.unit === 'min' 
            ? exerciseLog.amount * 60 * 1000 
            : 30 * 60 * 1000; 

        const endTime = Date.now();
        const startTime = endTime - durationMs;
        
        const startTimeNs = startTime * 1000000;
        const endTimeNs = endTime * 1000000;
        const datasetId = `${startTimeNs}-${endTimeNs}`;

        const url = `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments/datasets/${datasetId}`;

        const body = {
            dataSourceId: "derived:com.google.activity.segment:com.google.android.gms:merge_activity_segments",
            maxEndTimeNs: endTimeNs,
            minStartTimeNs: startTimeNs,
            point: [
                {
                    dataTypeName: "com.google.activity.segment",
                    startTimeNanos: startTimeNs,
                    endTimeNanos: endTimeNs,
                    value: [{ intVal: activityId }]
                }
            ]
        };

        await GoogleFitService.authenticatedFetch(url, 'PATCH', body);
    } catch (e) {
        console.error("Sync exercise failed", e);
    }
  }
};
