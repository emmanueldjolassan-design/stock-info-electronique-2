import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pfandgstpeyumbifdvmg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GGtXrozwO0S9nFHEfdyc8A_uabggweY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
