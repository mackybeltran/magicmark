"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function Settings() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        router.replace("/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (user === undefined) {
    // Still loading auth state
    return null;
  }

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/signin");
  };

  return (
    <main>
      <h1>Settings</h1>
      <p>Settings page content goes here.</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </main>
  );
} 