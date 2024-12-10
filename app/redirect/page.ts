"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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

        toast.success("Login successful!");
        window.location.href = 'http://localhost:3000/detect';
      } catch (error) {
        console.error("Error:", error);
        router.push("/error");
      }
    };

    fetchTokens();
  }, []);
};

export default FetchTokensAndRedirect;
