import { createClient } from "@supabase/supabase-js";

const STATE_ID = 1;

let client = null;

export function isCloudEnabled() {
    return Boolean(
        import.meta.env.VITE_SUPABASE_URL
        && import.meta.env.VITE_SUPABASE_ANON_KEY
    );
}

function getClient() {
    if (!isCloudEnabled()) return null;
    if (!client) {
        client = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
        );
    }
    return client;
}

export function normalizeAppData(data) {
    return {
        hubs: data?.hubs ?? [],
        villages: data?.villages ?? [],
        branches: data?.branches ?? [],
        logisticians: data?.logisticians ?? [],
        villageCoordinateOverrides: data?.villageCoordinateOverrides ?? {}
    };
}

export function isAppDataEmpty(data) {
    const normalized = normalizeAppData(data);
    return normalized.hubs.length === 0 && normalized.villages.length === 0;
}

export async function fetchCloudData() {
    const supabase = getClient();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("app_state")
        .select("data, updated_at")
        .eq("id", STATE_ID)
        .maybeSingle();

    if (error) throw error;
    if (!data?.data) return null;

    return {
        ...normalizeAppData(data.data),
        updatedAt: data.updated_at
    };
}

export async function saveCloudData(appData) {
    const supabase = getClient();
    if (!supabase) return false;

    const payload = normalizeAppData(appData);

    const { error } = await supabase
        .from("app_state")
        .upsert({
            id: STATE_ID,
            data: payload,
            updated_at: new Date().toISOString()
        });

    if (error) throw error;
    return true;
}

export function subscribeCloudData(onUpdate) {
    const supabase = getClient();
    if (!supabase) return () => {};

    const channel = supabase
        .channel("logisticmap-app-state")
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "app_state",
                filter: `id=eq.${STATE_ID}`
            },
            (payload) => {
                onUpdate(
                    normalizeAppData(payload.new.data),
                    payload.new.updated_at
                );
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
