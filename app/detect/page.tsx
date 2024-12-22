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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const api_key = localStorage.getItem("api_key") || "";
    const access = localStorage.getItem("access") || "";
    if (!api_key || api_key === undefined || api_key === "") {
      toast.error("API key is missing. Please create an API key to proceed.");
    }
    setToken(access);
  }, []);

  const isTokenReady = token && token.trim() !== "";

  const { ready, ws, val, send } = useWebsocket({ url: "wss://pbl6.site/ws", token: isTokenReady ? token : "" });

  useEffect(() => {
    if (ready && ws) {
      ws.onmessage = (event) => {
        setIsLoading(false);
        const message = JSON.parse(event.data);
  
        setUploadedImage(message.image_url);
        const predictionType = message.prediction.type;
        const confidencePercentage = message.prediction.confidence_percentage;

        const confidencePercentageValue = parseFloat(confidencePercentage.replace('%', ''));
        let calculatedConfidenceScore;
        if (predictionType === "Real") {
          calculatedConfidenceScore = 100 - confidencePercentageValue;
        } else {
          calculatedConfidenceScore = confidencePercentageValue;
        }
        setConfidenceScore(`${calculatedConfidenceScore}%`);
        setAnalysisResult(predictionType);
      };
  
      ws.onclose = () => {
        console.log("WebSocket closed, attempting to reconnect...");
        setIsLoading(false);
  
        const reconnectWebSocket = () => {
          console.log("Reconnecting...");
          const socket = new WebSocket("wss://pbl6.site/ws", ["Token", token]);
  
          socket.onopen = () => {
            console.log("WebSocket Reconnected");
          };
  
          socket.onclose = () => {
            console.log("WebSocket closed again, attempting to reconnect...");
            setTimeout(reconnectWebSocket, 5000); // Thử lại sau 5 giây
          };
  
          socket.onmessage = (event) => {
            console.log(event.data);
          };
        };
  
        reconnectWebSocket(); // Gọi hàm để kết nối lại
      };
    }
  }, [ready, ws, token]);
  

  const getMimeType = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return `image/${fileExtension}`;
  };

  const uploadAndPredict = async (file: File, mimeType: string) => {
    setIsLoading(true);
  
    try {
      const accessToken = localStorage.getItem("access");
      if (!accessToken) throw new Error("Missing access token");
  
      const signedUrlResponse = await fetch(`${apiUrl}/files/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ mime_type: mimeType }),
      });
  
      if (!signedUrlResponse.ok) throw new Error("Failed to get signed URL");
  
      const { upload_url, file_url } = await signedUrlResponse.json();
      console.log(upload_url);
      console.log(file_url);
      setUploadedImage(file_url);
  
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
      });
  
      if (!uploadResponse.ok) throw new Error("File upload failed");
  
      const key = localStorage.getItem("api_key") || "";
      const predictionsResponse = await fetch(`${apiUrl}/predictions`, {
        method: 'POST',
        body: JSON.stringify({ image_url: file_url }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': key,
        },
      });
  
      console.log(predictionsResponse);
    } catch (error: any) {
      toast.error(error.message || "Error processing file");
    } finally {
      setIsLoading(false);
    }
  };
  
//"{\"image_url\": \"https://storage.googleapis.com/pbl6-dev-media-bucket/f1dfb9d2-513a-43d9-bf21-102442dc2f7f\", 
// \"status\": \"success\", 
// \"prediction\": 
//        {\"type\": \"Real\", 
//        \"confidence_percentage\": \"0.00%\"
//      }
// }"


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
        console.log("mimeType:", mimeType);

        await uploadAndPredict(file, mimeType);
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
                console.log("mimeType:", mimeType);
                await uploadAndPredict(file, mimeType);
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
          {isLoading && (
            <div className={styles.loadingIndicator}>
              <div className={styles.loader}></div>
              <p>Loading...</p>
            </div>
          )}
          {!isLoading && uploadedImage && (
              <img src={uploadedImage} className={styles.uploadedImage} />
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
