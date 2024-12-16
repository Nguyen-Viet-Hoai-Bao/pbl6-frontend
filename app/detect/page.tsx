"use client";
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import { refreshAccessToken } from '@/utils/refreshAccessToken';
import toast from 'react-hot-toast';
import { useWebsocket } from '@/hooks/user-websocket';

export default function Index() {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>(''); // Kết quả phân tích
  const [confidenceScore, setConfidenceScore] = useState<string>(''); // Điểm xác suất

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [token, setToken] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const access = localStorage.getItem("access") || "";
      const key = localStorage.getItem("api_key") || "";
      setToken(access);
      setApiKey(key);
    }
  }, []);

  const {ready, ws} = useWebsocket({url: "wss://pbl6.site/ws", token:token});

  useEffect(() => {    
    if (ready) {
      if(ws){
        ws.onmessage = (message)=>{
          console.log(message);
        }
      }
    }
  }, [ready, ws]);

  const getMimeType = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return `image/${fileExtension}`;
  };

  const uploadAndPredict = async (file: File, mimeType: string) => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) throw new Error("Missing access token");

    const signedUrlResponse = await fetch(`${apiUrl}/files/signed-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ mime_type: mimeType })
    });

    if (!signedUrlResponse.ok) throw new Error("Failed to get signed URL");

      const { upload_url, file_url } = await signedUrlResponse.json();
      console.log(upload_url);
      console.log(file_url);
      setUploadedImage(file_url);
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file
    });

    if (!uploadResponse.ok) throw new Error("File upload failed");

    const predictionsResponse = await fetch('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ file_url }),
        headers: {
          'Content-Type': 'application/json', 
          'x-api-key': apiKey,
         }
    });

    const result = await predictionsResponse.json();
    if (!predictionsResponse.ok) throw new Error("Prediction failed");
    console.log(result);

    return result;
};

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const expirationTime = localStorage.getItem("expiration");
    if (!expirationTime || Date.now() >= parseInt(expirationTime)) {
        await refreshAccessToken();
        return;
    }

    try {
        const mimeType = getMimeType(file);
        console.error("mimeType:", mimeType);

        const result = await uploadAndPredict(file, mimeType);
        setAnalysisResult(result.analysis);
        setConfidenceScore(result.confidence);
    } catch (error: any) {
        toast.error(error.message || "Error processing file");
    }
};

const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const expirationTime = localStorage.getItem("expiration");
    if (!expirationTime || Date.now() >= parseInt(expirationTime)) {
        await refreshAccessToken();
        return;
    }

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (!file) continue;

            try {
                const mimeType = getMimeType(file);
                console.error("mimeType:", mimeType);
                const result = await uploadAndPredict(file, mimeType);
                setAnalysisResult(result.analysis);
                setConfidenceScore(result.confidence);
            } catch (error: any) {
                toast.error(error.message || "Error processing pasted image");
            }
            break;
        }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

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
        <label className={styles.uploadArea}>
          {uploadedImage && (
              <img src={uploadedImage} alt="Uploaded" className={styles.uploadedImage} />
          )}
          <input
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
          />
          {!uploadedImage && (
            <p className={styles.uploadPrompt}>Click or Drag to Upload</p>
          )}
        </label>

        {analysisResult && (
          <div className={styles.resultContainer}>
            <div className={styles.resultTitleContainer}>
              <h2 className={styles.resultTitle}>Analysis Result</h2>
            </div>
            <div className={styles.resultContent}>
              <p className={styles.resultText}>The input is: {analysisResult}</p>
              <p className={styles.confidenceText}>{confidenceScore}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
