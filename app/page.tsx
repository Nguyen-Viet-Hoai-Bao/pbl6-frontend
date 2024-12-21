"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from '../app/detect/page.module.css';

const Home = () => {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    const access = localStorage.getItem("access") || "";
    setToken(access);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const isLoggedIn = token && token.trim() !== "";

  const handlePaste = async (event: ClipboardEvent) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>AI-GENERATED CONTENT DETECTION</h1>
        <p className={styles.description}>
          Machine learning models to detect AI-generated content
        </p>
        <div className={styles.note}>
          <p>
            Upload images and videos here to test our model in real-time!<br />
            Supports png, jpeg, jpg, webp.
          </p>
        </div>

        {!isLoggedIn && (
          <div className={styles.uploadPromptMess}>Please log in to upload images</div>
        )}

        <label className={styles.uploadArea}>
          <input
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
            disabled={!isLoggedIn}
          />
          {!uploadedImage && !isLoggedIn && (
            <p className={styles.uploadPrompt}>Click or Drag to Upload</p>
          )}
        </label>
      </main>
    </div>
  );
};

export default Home;
