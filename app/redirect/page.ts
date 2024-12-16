"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const detectUrl = process.env.NEXT_PUBLIC_DETECT_URL || "";

const FetchTokensAndRedirect = () => {
  const router = useRouter();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchTokens = async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/tokens`, {
          credentials: "include",
        });

        const data = await response.json();
        const expirationTime = Date.now() + 300000;
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("expiration", expirationTime.toString());

        var extensionId = "pfmakofgolegonmehffgcfbiehnaolfc";

        chrome.runtime.sendMessage(extensionId, {message: "Hello from the webpage!"}, function(response) {
          if (!response.success) {
            console.log("Error: " + response.error);
          }
        });
        
        toast.success("Login successful!");
        window.location.href = detectUrl;
      } catch (error) {
        console.error("Error:", error);
        router.push("/error");
      }
    };

    fetchTokens();
  }, [router]);
};

export default FetchTokensAndRedirect;

// "use client";
// import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import toast from "react-hot-toast";

// const apiUrl = process.env.NEXT_PUBLIC_API_URL;
// const detectUrl = process.env.NEXT_PUBLIC_DETECT_URL || "";

// const FetchTokensAndRedirect = () => {
//   const router = useRouter();
//   const hasFetched = useRef(false);

//   const sendTokenToExtension = (token: String) => {
//     window.chrome.runtime.sendMessage(
//       "YOUR_EXTENSION_ID", // Thay bằng ID của extension
//       { type: "SET_ACCESS_TOKEN", token },
//       (response) => {
//         if (response.success) {
//           console.log("Token sent successfully!");
//         } else {
//           console.error("Failed to send token:", response.error);
//         }
//       }
//     );
//   };
  
//   useEffect(() => {
//     if (hasFetched.current) return;
//     hasFetched.current = true;

//     const fetchTokens = async () => {
//       try {
//         const response = await fetch(`${apiUrl}/auth/tokens`, {
//           credentials: "include",
//         });

//         const data = await response.json();
//         const expirationTime = Date.now() + 300000;
//         localStorage.setItem("access", data.access);
//         localStorage.setItem("refresh", data.refresh);
//         localStorage.setItem("expiration", expirationTime.toString());

//         sendTokenToExtension(data.access);

//         toast.success("Login successful!");
//         window.location.href = detectUrl;
//       } catch (error) {
//         console.error("Error:", error);
//         router.push("/error");
//       }
//     };

//     fetchTokens();
//   }, [router]);
// };

// export default FetchTokensAndRedirect;

