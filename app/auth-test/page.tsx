'use client';

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/client";

export default function AuthTestPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current session user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Get user called", user); // null without signin
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Listening to login logout", subscription);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google", // google client and secret saved in supabase
      options: {
        redirectTo: `${window.location.origin}/auth-test`,
      },
    });

    if (error) {
      console.error(error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Supabase Auth Test</h1>

      {!user ? (
        <button onClick={loginWithGoogle}>
          Sign in with Google
        </button>
      ) : (
        <>
          <p>Logged in!</p>
          <p>Name: {user.user_metadata.full_name}</p>
          <p>Email: {user.email}</p>
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            width={80}
            height={80}
          />
          <br />
          <button onClick={logout}>
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}