"use client";
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import { refreshAccessToken } from '@/utils/refreshAccessToken';
import toast from 'react-hot-toast';

export default function Index() {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>(''); // Kết quả phân tích
  const [confidenceScore, setConfidenceScore] = useState<string>(''); // Điểm xác suất
  const [socketData, setSocketData] = useState<string>("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // const accessToken = localStorage.getItem("access");

    // if (accessToken) {
    //   const ws = new WebSocket('wss://pbl6.site/ws', {
    //     headers: {
    //       'Authorization': accessToken,
    //     }
    //   });
    
    //   ws.onopen = function() {
    //     console.log("WebSocket connection established");
    
    //     // Gửi token xác thực ngay sau khi kết nối thành công
    //     ws.send(JSON.stringify({
    //       type: "Authenticate",
    //       token: accessToken
    //     }));
    //   };
    // } else {
    //   console.error("Access token is missing");
    // }

    // // Xử lý sự kiện khi nhận message từ WebSocket
    // ws.onmessage = (event) => {
    //     console.log("Received from WebSocket:", event.data);

    //     const data = JSON.parse(event.data);

    //     if (data.type === 'prediction_result') {
    //         setAnalysisResult(data.analysis);
    //         setConfidenceScore(data.confidence);
    //         toast.success("Prediction result received");
    //     }

    //     setSocketData(data);
    // };

    // // Xử lý sự kiện khi WebSocket gặp lỗi
    // ws.onerror = (error) => {
    //     console.error("WebSocket error:", error);
    // };

    // // Xử lý sự kiện khi WebSocket đóng kết nối
    // ws.onclose = () => {
    //     console.log("WebSocket connection closed");
    // };

    // // Đóng WebSocket khi component unmount
    // return () => {
    //     // ws.close();
    // };
  }, []);


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
      console.error("upload_url:", upload_url);
      console.error("file_url:", file_url);

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file
    });

    if (!uploadResponse.ok) throw new Error("File upload failed");

    const predictionsResponse = await fetch('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ file_url }),
        headers: { 'Content-Type': 'application/json' }
    });

    const result = await predictionsResponse.json();
    if (!predictionsResponse.ok) throw new Error("Prediction failed");

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
  // const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const temporaryImageUrl = URL.createObjectURL(file);
  //   setUploadedImage(temporaryImageUrl);

  //   const formData = new FormData();
  //   formData.append('file', file);

  //   try {
  //     const response = await fetch('/api/upload', {
  //       method: 'POST',
  //       body: formData,
  //     });
  //     const result = await response.json();

  //     if (response.ok) {
  //       setAnalysisResult(result.analysis);
  //       setConfidenceScore(result.confidence);
  //     } else {
  //       setAnalysisResult(result.analysis);
  //       setConfidenceScore(result.confidence);
  //     }
  //   } catch (error) {
  //     setAnalysisResult("likely to contain AI Generated Text");
  //     setConfidenceScore("99.9%");
  //   }
  // };

  // const handlePaste = async (event: ClipboardEvent) => {
  //   const expirationTime = localStorage.getItem("expiration");
  //   if (expirationTime && Date.now() < parseInt(expirationTime)) {
  //     const items = event.clipboardData?.items;
  //     if (!items) return;
  //     for (let i = 0; i < items.length; i++) {
  //       if (items[i].type.startsWith('image/')) {
  //         const file = items[i].getAsFile();
  //         if (file) {
  //           const temporaryImageUrl = URL.createObjectURL(file);
  //           setUploadedImage(temporaryImageUrl);

  //           const formData = new FormData();
  //           formData.append('file', file);

  //             try {
  //               const response = await fetch('/api/upload', {
  //                 method: 'POST',
  //                 body: formData,
  //               });
  //               const result = await response.json();

  //               if (response.ok) {
  //                 setAnalysisResult(result.analysis);
  //                 setConfidenceScore(result.confidence);
  //               } else {
  //                 setAnalysisResult(result.analysis);
  //                 setConfidenceScore(result.confidence);
  //               }
  //             } catch (error) {
  //               setAnalysisResult("likely to contain AI Generated Text");
  //               setConfidenceScore("99.9%");
  //             }
  //         }
  //         break;
  //       }
  //     }
  //   } else {
  //     await refreshAccessToken();
  //   }
  // };

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
            <Image src={uploadedImage} alt="Uploaded" className={styles.uploadedImage} />
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
