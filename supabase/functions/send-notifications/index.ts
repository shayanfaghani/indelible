import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscriptions, error } = await supabase.rpc("get_due_push_subscriptions");

    if (error) {
        console.error("Failed to fetch due subscriptions:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    const staleEndpoints: string[] = [];
    let sent = 0;

    await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify({ title: "Indelible", url: "/dashboard" })
                );
                sent++;
            } catch (err: any) {
                if (err.statusCode === 410) staleEndpoints.push(sub.endpoint);
                else console.error("Push failed:", sub.endpoint, err.message);
            }
        })
    );

    if (staleEndpoints.length > 0) {
        await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
    }

    return new Response(JSON.stringify({ sent, cleaned: staleEndpoints.length }), { status: 200 });
});
