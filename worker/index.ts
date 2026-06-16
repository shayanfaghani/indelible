declare const self: ServiceWorkerGlobalScope;

const MESSAGES = [
    "It's time to grow your knowledge 🌱",
    "Your daily review is waiting — keep the streak alive!",
    "A few minutes today = permanent knowledge forever.",
    "The vault is calling. Let's add more to it.",
    "Small steps, lifelong results. Review time!",
    "Your future self will thank you. Time to review!",
    "Knowledge compounds daily. Don't miss today's session.",
    "Your cards are ready. Let's make it count.",
    "Consistency builds mastery. Your session awaits.",
    "Every review brings you closer to the Vault. 🏛️",
];

self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {};
    const body = data.body ?? MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    event.waitUntil(
        self.registration.showNotification(data.title ?? "Indelible", {
            body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            data: { url: data.url ?? "/dashboard" },
            requireInteraction: false,
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url ?? "/dashboard";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(url) && "focus" in client) {
                        return client.focus();
                    }
                }
                return self.clients.openWindow(url);
            })
    );
});
