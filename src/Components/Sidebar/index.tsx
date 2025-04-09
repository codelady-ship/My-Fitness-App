// src/Components/Sidebar/index.tsx
'use client';

import React from 'react';
import { Ilinks } from '../../../Interface/links';
import { links } from '../../../Mock/links';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';
import useSidebarStore from '../../../Store/SidebarStore'; 
import  {usePathname} from 'next/navigation';
const Sidebar = () => {
  const { isOpen, toggleSidebar,darkMode } = useSidebarStore(); // Sidebar state
  const path = usePathname();
  return (
    <div className={`sticky top-0 left-0 ${darkMode ? 'bg-black' : ' bg-yellow-50'} flex flex-col gap-5 border border-r-amber-700 min-h-[100vh] transition-all duration-300 ease-in-out ${isOpen ? 'w-[300px]' : 'w-[80px]'}`}
    >
      <div className="flex justify-between items-center p-4">

        {/* Toggle button */}
        <button onClick={toggleSidebar} className="text-2xl ml-2">
          {isOpen ? <FaTimes size={26}/> : <FaBars size={26} />}
        </button>
      </div>

      {/* Sidebar Links */}
      <div className="flex flex-col">
        {links.map(({ id, title, to, icon }: Ilinks) => {
          return (
            <Link
              href={to}
              key={id}
              className={`flex items-center gap-3 font-bold p-4 ${isOpen ? '' : 'justify-center'}  ${path === to ? "text-amber-500 " : "text-black"} ${darkMode ?  'text-yellow-50' : 'text-black'}`}
            >
             <span className='text-3xl'>{React.createElement(icon)}</span> 
              <span className={`${isOpen ? 'block' : 'hidden'} text-2xl`}>{title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
