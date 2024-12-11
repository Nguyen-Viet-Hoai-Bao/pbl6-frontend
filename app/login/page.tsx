"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";

const NextLoginPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [providers, setProvider] = useState<any[]>([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrlAll = process.env.NEXT_PUBLIC_API_URL_ALL;
  const callbackUrl = process.env.NEXT_PUBLIC_CALLBACK_URL || "";


  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const response = await fetch(`${apiUrlAll}/_allauth/browser/v1/config`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("socialaccount:", data.data.socialaccount);
        setProvider(data.data.socialaccount.providers);
      } catch (err) {
        toast.error("Failed to fetch providers");
      }
    };

    fetchProvider();
  }, [apiUrlAll]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  async function handleClick(id: string) {
    const form = document.createElement("form");
    form.style.display = "none";
    form.method = "POST";
    form.action = `${apiUrl}/auth/login/socials`;
    const data = {
      provider: id,
      callback_url: callbackUrl,
    };
    console.log("data:", data);

    Object.entries(data).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();
      const expirationTime = Date.now() + 300000;
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("expiration", expirationTime.toString());

        window.location.href = 'http://localhost:3000/detect';
      // toast.success("Successful login");
      // router.push("/detect");
    } catch (error) {
      setError("Invalid email or password");
      toast.error("Invalid email or password");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const form = e.currentTarget as HTMLFormElement; // Type assertion
    const email = form.email.value;
    const password = form.password.value;
  
    if (!isValidEmail(email)) {
      setError("Email is invalid");
      toast.error("Email is invalid");
      return;
    }
  
    if (!password || password.length < 8) {
      setError("Password is invalid");
      toast.error("Password must be at least 8 characters");
      return;
    }
  
    await handleLogin(email, password);
  };  

  return (
      <div className="flex min-h-full flex-1 flex-col justify-center sm:px-6 lg:px-8">
        <div className="flex justify-center flex-col items-center">
          <h2 className="mt-6 text-center text-2xl leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm leading-6">
                  <Link href="#" className="text-black hover:text-gray-900">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full border border-black justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-white transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Sign in
                </button>
              </div>
            </form>

            <div>
              <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-gray-900">Or continue with</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {providers?.map((provider) => {
                  const getButtonProps = (providerId: string) => ({
                    key: providerId,
                    onClick: () => handleClick(providerId),
                  });
                  if (provider.id === "google") {
                    return (
                      <button
                        {...getButtonProps(provider.id)}
                        className="flex w-full items-center border border-gray-300 justify-center gap-3 rounded-md bg-white px-3 py-1.5 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <FcGoogle />
                        <span className="text-sm font-semibold leading-6">Google</span>
                      </button>
                    );
                  }

                  if (provider.id === "github") {
                    return (
                      <button
                        {...getButtonProps(provider.id)}
                        className="flex w-full items-center justify-center gap-3 rounded-md bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F]"
                      >
                        <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466..."
                          />
                        </svg>
                        <span className="text-sm font-semibold leading-6">GitHub</span>
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default NextLoginPage;
