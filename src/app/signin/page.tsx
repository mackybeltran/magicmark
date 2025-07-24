"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function Signin() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    router.push("/settings");
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-6 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Sign In</h1>
        {user ? (
          <div className="text-center mb-6 w-full">
            <p className="font-medium mb-2">
              Signed in as:<br />
              <span className="text-blue-600">{user.displayName} ({user.email})</span>
            </p>
            <button
              onClick={handleSignOut}
              className="mt-5 w-full max-w-xs py-3 px-6 text-base rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full max-w-xs py-3 px-6 text-base rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </main>
  );
} 