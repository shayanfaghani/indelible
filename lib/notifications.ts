function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const bytes = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
    return bytes;
}

export async function requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) return "denied";
    if (Notification.permission !== "default") return Notification.permission;
    return Notification.requestPermission();
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;
    return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
}

export async function unsubscribeFromPush(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
    return subscription;
}

export async function saveSubscription(subscription: PushSubscription): Promise<void> {
    const key = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");
    const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: key ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(key)))) : "",
            auth: auth ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth)))) : "",
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save push subscription");
    }
}

export async function deleteSubscription(endpoint: string): Promise<void> {
    const res = await fetch("/api/notifications/unsubscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to remove push subscription");
    }
}
