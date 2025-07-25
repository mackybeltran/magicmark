"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getDatabase, ref, get, child, remove } from "firebase/database";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import AddPhoto from "./AddPhoto";
import RemovePhoto from "./RemovePhoto";

export default function Settings() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [photos, setPhotos] = useState<
    { id: string; file_name: string; label: string; location: string }[]
  >([]);

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

  useEffect(() => {
    if (user) {
      const fetchPhotos = async () => {
        try {
          const db = getDatabase();
          const dbRef = ref(db);
          // Fetch photos from data/photos
          const photosSnapshot = await get(child(dbRef, "data/photos"));
          if (photosSnapshot.exists()) {
            const data = photosSnapshot.val();
            // Convert object to array with id
            const photoList = Object.entries(data).map(([id, value]) => ({
              id,
              ...(value as { file_name: string; label: string; location: string }),
            }));
            setPhotos(photoList);
          } else {
            setPhotos([]);
          }
        } catch (error) {
          // Optionally handle error
        }
      };
      fetchPhotos();
    }
  }, [user]);

  if (user === undefined) {
    // Still loading auth state
    return null;
  }

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/signin");
  };

  // Delete photo handler
  const handleDeletePhoto = async (photo: { id: string; file_name: string; location: string }) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      // 1. Delete from Storage
      const storage = getStorage();
      const fileRef = storageRef(storage, `photo-gallery/${photo.file_name}`);
      await deleteObject(fileRef);

      // 2. Delete from Database
      const db = getDatabase();
      const photoDbRef = ref(db, `data/photos/${photo.id}`);
      await remove(photoDbRef);

      // 3. Remove from local state
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (error) {
      alert("Failed to delete photo.");
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="mb-4 text-gray-600">Settings page content goes here.</p>
      <button
        onClick={handleSignOut}
        className="mb-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Sign Out
      </button>
      <section>
        <h2 className="text-xl font-semibold mb-4">Your Photos</h2>
        <div className="flex flex-wrap gap-4">
          {/* Add Photo Feature */}
          <AddPhoto
            onPhotoAdded={(photo) =>
              setPhotos((prev) => [...prev, photo])
            }
          />
          {/* Photo Thumbnails */}
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col items-center w-24 relative">
              <RemovePhoto onClick={() => handleDeletePhoto(photo)} />
              <img
                src={photo.location}
                alt={photo.label}
                className="w-20 h-20 object-cover rounded mb-2 border border-gray-200 shadow"
              />
              <div className="text-xs text-center text-gray-700 truncate w-full">{photo.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}