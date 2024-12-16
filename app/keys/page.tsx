"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

const Keys = () => {
    const [apiKeyType, setApiKeyType] = useState("free_tier");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const accessToken = localStorage.getItem("access");
        const expirationTime = localStorage.getItem("expiration");

        if (expirationTime && Date.now() < parseInt(expirationTime)) {
            try {
                const response = await fetch(`${apiUrl}/api-keys`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        // last_used: new Date().toISOString(),
                        api_key_type: apiKeyType,
                        is_default: true,
                    }),
                });

                if (response) {
                    const data = await response.json();
                    localStorage.setItem("api_key", data.api_key);
                    console.log(data);
                    toast.success("API Key created successfully!");
                } else {
                    toast.error("Failed to create API Key");
                }
            } catch (error) {
                toast.error("Error creating API Key");
            }
        } else {
            toast.error("Session expired, please log in again.");
        }
    };

    return (
        <div className="flex pt-20 pb-20 flex-1 flex-row justify-center sm:px-8 lg:px-10">
            <div className="w-1/2 pl-4">
                <h1 className="text-3xl mb-4">Create API Key</h1>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div>
                        <label htmlFor="api_key_type" className="block text-sm font-medium text-gray-700">API Key Type</label>
                        <select
                            name="api_key_type"
                            id="api_key_type"
                            value={apiKeyType}
                            onChange={(e) => setApiKeyType(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="free_tier">Free Tier</option>
                            <option value="enterprise_tier">Enterprise Tier</option>
                            <option value="custom_tier">Custom Tier</option>
                        </select>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            className="mt-4 bg-indigo-600 text-white font-semibold py-1 px-2 rounded-md shadow hover:bg-indigo-500 text-base"
                        >
                            Create API Key
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Keys;
