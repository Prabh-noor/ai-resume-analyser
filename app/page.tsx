'use client'
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
// import { getServerSession } from "next-auth/next"

export default function Home() {
    const { data: session, status } = useSession();
    // const session = await getServerSession(req, res, authOptions)

    console.log("Session", session, status);
    if (status === "loading") {
        return <p>Loading...</p>;
    }

    if (!session) {
        return (
        <>
            <p>Not signed in</p>
            <button onClick={() => signIn("google")}>
                Sign in with Google
            </button>
        </>);
    }

    return (
        <div>
            <button onClick={() => signOut()}>
                Sign Out
            </button>
            <p>Name: {session.user?.name}</p>
            <p>Email: {session.user?.email}</p>
        </div>
    );
}
