// https://supabase.com/docs/reference/javascript/auth-signinwithoauth
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

// to use
// const supabase = createClient();
// await supabase.auth.signInWithOAuth({
//   provider: "google",
// });