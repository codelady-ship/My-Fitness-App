// src/app/layout.tsx
'use client';
import "./globals.css";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { Poppins } from 'next/font/google';
import useSidebarStore  from '../../Store/SidebarStore';

const poppins = Poppins({ weight: "100" });


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {darkMode} = useSidebarStore(); //  theme state

  return (
    <html lang="en">
      <body className={`${poppins.className} `}>
        <div className={`flex  ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
          <Sidebar />
          <div className="w-full">
            <Navbar />
            <div>{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
