import toast from "react-hot-toast";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem("refresh");

  if (refreshToken) {
    try {
      const response = await fetch(`${apiUrl}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh access token");
      }

      const data = await response.json();
      const newExpirationTime = Date.now() + 300000;
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("expiration", newExpirationTime.toString());
      return true; 
    } catch (error) {
      return false;
    }
  } else {
    toast.error("No refresh token available");
    return false;
  }
};
