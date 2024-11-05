import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/utils/SessionProvider";
import Navbar from "@/components/Navbar";
import Providers from "@/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className={inter.className}
          style={{
            background: 'linear-gradient(153deg, rgb(229, 155, 255), rgb(178, 255, 237) 74%)',
          }}>
        <SessionProvider session={session}>
          <div className="mx-auto max-w-5xl text-2xl gap-2 mb-20">
            <Navbar />
            <Providers>
            {children}
            </Providers>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
