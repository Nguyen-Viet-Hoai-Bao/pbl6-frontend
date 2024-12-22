"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface ApiKey {
    id: number;
    user: string;
    api_key: string;
    created_at: string;
    last_used: string;
    api_key_type: string;
    maximum_usage: number;
    total_usage: number;
    is_active: boolean;
}

const Keys = () => {
    const [apiKeyType, setApiKeyType] = useState<string>("free_tier");
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const fetchApiKeys = async () => {
        try {
            const accessToken = localStorage.getItem("access");
            const response = await fetch(`${apiUrl}/api-keys?page=${currentPage}&limit=${limit}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch API keys");
            }

            const data = await response.json();
            setApiKeys(data.results);
        } catch (error) {
            console.error("Error fetching API keys:", error);
        }
    };

    useEffect(() => {
        fetchApiKeys();
    }, [currentPage, limit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const accessToken = localStorage.getItem("access");
        if (!accessToken) {
            toast.error("Access token is missing");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api-keys`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    api_key_type: apiKeyType,
                    is_active: true,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("data: ", data);
                localStorage.setItem("is_active", data.is_active);
                localStorage.setItem("api_key", data.api_key);
                toast.success("API Key created successfully!");
                setCurrentPage(1);
                fetchApiKeys();
            } else {
                toast.error("Failed to create API Key");
            }
        } catch (error) {
            toast.error("Error creating API Key");
        }
    };

    const handleDelete = async (id: number) => {
        const accessToken = localStorage.getItem("access");
        if (!accessToken) {
            toast.error("Access token is missing");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api-keys/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                toast.success("API Key deleted successfully!");
                setCurrentPage(1);
                fetchApiKeys();
            } else {
                toast.error("Failed to delete API Key");
            }
        } catch (error) {
            toast.error("Error deleting API Key");
        }
    };

    const handleUpdate = async (id: number, isDefault: boolean) => {
        const accessToken = localStorage.getItem("access");
        if (!accessToken) {
            toast.error("Access token is missing");
            return;
        }

        const updatedIsDefault = !isDefault;

        try {
            const response = await fetch(`${apiUrl}/api-keys/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ is_active: updatedIsDefault }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("is_active", data.is_active);
                localStorage.setItem("api_key", data.api_key);
                fetchApiKeys();
                toast.success("API Key updated successfully!");
            } else {
                toast.error("Failed to update API Key");
            }
        } catch (error) {
            toast.error("Error updating API Key");
        }
    };

    const handleNextPage = () => setCurrentPage(currentPage + 1);
    const handlePrevPage = () => setCurrentPage(currentPage - 1);

    return (
        <div className="flex pt-20 pb-20 flex-1 flex-col items-center sm:px-8 lg:px-10">
            <div className="w-1/2">
                <h1 className="text-3xl mb-4">Create API Key</h1>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div>
                        <label htmlFor="api_key_type" className="block text-sm font-medium text-gray-700">
                            API Key Type
                        </label>
                        <select
                            id="api_key_type"
                            value={apiKeyType}
                            onChange={(e) => setApiKeyType(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="free_tier">Free Tier</option>
                            <option value="enterprise_tier">Enterprise Tier</option>
                            <option value="custom_tier">Custom Tier</option>
                        </select>
                    </div>
                    <button type="submit" className="mt-4 bg-indigo-600 text-white font-semibold py-1 px-2 rounded-md shadow hover:bg-indigo-500">
                        Create API Key
                    </button>
                </form>
            </div>

            <div className="w-full mt-10">
                <h2 className="text-xl mb-4">Existing API Keys</h2>
                <table className="min-w-full table-auto text-sm">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2 text-center">ID</th>
                            <th className="border px-4 py-2 text-center">Key</th>
                            <th className="border px-4 py-2 text-center">Type</th>
                            <th className="border px-4 py-2 text-center">Default</th>
                            <th className="border px-4 py-2 text-center">Created At</th>
                            <th className="border px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(apiKeys) && apiKeys.map((key) => (
                            <tr key={key.id}>
                                <td className="border px-4 py-2 text-center">{key.id}</td>
                                <td className="border px-4 py-2 text-center">{key.api_key}</td>
                                <td className="border px-4 py-2 text-center">{key.api_key_type}</td>
                                <td className={`border px-4 py-2 text-center ${key.is_active ? "font-bold" : ""}`}>
                                    {key.is_active ? "Yes" : "No"}
                                </td>
                                <td className="border px-4 py-2 text-center">{new Date(key.created_at).toLocaleDateString()}</td>
                                <td className="border px-4 py-2 text-center">
                                    <button
                                        aria-label={`Update API Key ${key.id}`}
                                        onClick={() => handleUpdate(key.id, key.is_active)}
                                        className="text-blue-500 mr-2"
                                    >
                                        Update
                                    </button>
                                    <button
                                        aria-label={`Delete API Key ${key.id}`}
                                        onClick={() => handleDelete(key.id)}
                                        className="text-red-500"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="mt-4">
                <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1}
                    className="mr-4 rounded-md bg-black px-3 py-2 border border-gray-500 border-1 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"

                >
                    Prev
                </button>
                <button 
                    onClick={handleNextPage} 
                    disabled={apiKeys.length < limit}
                    className="mr-4 rounded-md bg-black px-3 py-2 border border-gray-500 border-1 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Keys;
