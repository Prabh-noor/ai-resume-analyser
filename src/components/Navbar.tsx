'use client'

import { useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Image from "next/image";

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}


const Navbar = () => {
    const supabase = createClient();
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<User | null>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            console.log("Get user called", user);
            setUser(user);
        };

        getUser();
    }, [])

    const onLogout = async () => {
        const { error } = await supabase.auth.signOut();
        console.log("Signout triggered");
        if (error) {
            console.error(error.message);
        }
        setUser(null)
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.href,
            },
        });

        if (error) {
            console.error(error.message);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-5">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-1">
                <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M4 6h16M4 18h16" />
                    </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700 tracking-tight">ResumeBuilder</span>
            </div>

            {!user ?

                <button onClick={loginWithGoogle}>
                    Sign in with Google
                </button>
                :
                <div className="relative" ref={menuRef}>
                    {/* User menu */}
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            {user.user_metadata.avatar_url ?
                                <Image src={user.user_metadata.avatar_url} width={32} height={32} className="rounded-full" alt="Profile" />
                                :
                                <span className="text-xs font-semibold text-indigo-600">
                                    {getInitials(user.user_metadata.full_name)}
                                </span>
                            }
                        </div>
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-100/80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">

                            {/* Menu items */}
                            <div className="p-1">
                                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors text-left">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile
                                </button>
                                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors text-left">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </button>
                            </div>

                            <div className="p-1 border-t border-slate-50">
                                <button
                                    onClick={() => { setMenuOpen(false); onLogout(); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        </header >
    );
};

export default Navbar