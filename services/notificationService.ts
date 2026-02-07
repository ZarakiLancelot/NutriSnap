
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendDailyReminder = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png", // Generic healthy icon
      silent: false,
    });
  }
};

export const scheduleReminders = (profile: any) => {
    // In a real PWA/Mobile app, this would use a Service Worker or native push.
    // For this web demo, we simulate a check or send an immediate confirmation.
    
    setTimeout(() => {
        sendDailyReminder(
            "📅 Plan de Hoy - NutriSnap",
            `💧 Meta Agua: 0/${profile.waterGlasses} vasos\n🏃 Ejercicio: ¿Te toca hoy? (${profile.exerciseDays} días/sem)\n🥗 Dieta: ${profile.isDieting ? 'Estricta' : 'Balanceada'}`
        );
    }, 5000); // Simulate a notification appearing shortly after setup for demo purposes
};
