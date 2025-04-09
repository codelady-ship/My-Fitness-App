// src/Components/Navbar/index.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSidebarStore from '../../../Store/SidebarStore'; // Tema mağazasını idxal et

const Navbar = () => {
  const { darkMode, toggleTheme } = useSidebarStore(); // Tema vəziyyətini əldə et və dəyişdir
  
  return (
    <div className={`px-5 py-1 border-b-amber-700 sticky top-0 z-10 ${darkMode ? 'bg-black' : ' bg-yellow-50'}`}>
      <div className="flex justify-between h-[80px] items-center">
        <Link href="/">
         <h1 className={`font-bold text-5xl  ${darkMode ? 'text-yellow-50' : 'text-black' }`}>Fitness🥇</h1>
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/images.jpg" alt="user-avatar" width={60} height={60} className="rounded-full border-3 border-b-pink-50" />
          <p className="font-bold text-2xl hover:text-amber-500">User Name</p>
          {/* Tema dəyişmə düyməsi */}
          <button onClick={toggleTheme} className="ml-4 text-2xl">
            {darkMode ? '🌙' : '🌞'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
