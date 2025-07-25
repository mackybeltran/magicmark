"use client";

import { useState } from "react";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getDatabase, ref, child, set } from "firebase/database";

type AddPhotoProps = {
  onPhotoAdded: (photo: { id: string; file_name: string; label: string; location: string }) => void;
};

export default function AddPhoto({ onPhotoAdded }: AddPhotoProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setPendingPhoto(file.name);

    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `photo-gallery/${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setUploading(false);
          setUploadProgress(null);
          setPendingPhoto(null);
          alert("Failed to upload photo.");
        },
        async () => {
          const url = await getDownloadURL(fileRef);
          const db = getDatabase();
          const photosDbRef = ref(db, "data/photos");
          const newPhotoRef = child(photosDbRef, file.name.replace(/\./g, "_"));

          await set(newPhotoRef, {
            file_name: file.name,
            label: "",
            location: url,
          });

          onPhotoAdded({
            id: file.name.replace(/\./g, "_"),
            file_name: file.name,
            label: "",
            location: url,
          });

          setUploading(false);
          setUploadProgress(null);
          setPendingPhoto(null);
        }
      );
    } catch (error) {
      setUploading(false);
      setUploadProgress(null);
      setPendingPhoto(null);
      alert("Failed to upload photo.");
    }
  };

  return (
    <>
      <label className="flex flex-col items-center w-24 cursor-pointer group">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
          disabled={uploading}
        />
        <div className="w-20 h-20 flex items-center justify-center rounded mb-2 border-2 border-dashed border-gray-300 bg-gray-50 group-hover:border-blue-400 transition relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-gray-400 group-hover:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="text-xs text-center text-gray-500 w-full">Add Photo</div>
      </label>
      {uploading && pendingPhoto && (
        <div className="flex flex-col items-center w-24">
          <div className="w-20 h-20 flex items-center justify-center rounded mb-2 border border-blue-300 bg-blue-50 relative">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-100 rounded-b">
              <div
                className="bg-blue-500 h-2 rounded-b transition-all"
                style={{ width: `${uploadProgress ?? 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-xs text-center text-blue-700 truncate w-full">{pendingPhoto}</div>
        </div>
      )}
    </>
  );
}