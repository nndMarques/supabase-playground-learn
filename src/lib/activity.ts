import { supabase } from "@/integrations/supabase/client";

export async function logActivity(
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabase.from("activity_log").insert({ user_id: userId, action, metadata: metadata as never });
  } catch (e) {
    console.warn("[activity] failed to log", action, e);
  }
}
