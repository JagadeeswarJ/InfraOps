import { createClient } from "@supabase/supabase-js";
import { env } from "../utils/env.util.js";
const supabaseUrl = env.SUPABASE_URL!;
const supabaseKey = env.SUPABASE_KEY!;

if (supabaseUrl === undefined || supabaseKey === undefined) {
    console.log("Supabase URL or Key is not defined in environment variables.");
}
export const supabase = createClient(supabaseUrl, supabaseKey);