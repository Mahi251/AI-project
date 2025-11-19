import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Addis Pathfinding Visualizer",
  description:
    "Compare Uniform Cost Search and A* on the Addis Ababa inner-city road network."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}

