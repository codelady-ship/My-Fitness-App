'use client';
import React from 'react';
import Link from 'next/link';
import { staffData } from '../../../Mock/staff'; 
import StaffCard from './StaffCard';
import useSidebarStore from '../../../Store/SidebarStore'; 

const Staff = () => {
  const { darkMode } = useSidebarStore();

  return (
    <div>
      <div
        className={`flex justify-between ${
          darkMode ? 'bg-black' : 'bg-yellow-50'
        } p-5 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}
      >
        <h2 className="text-2xl">Staff</h2>
        <Link
          href="/create-staff"
          className="border border-amber-700 py-1 px-2 hover:text-amber-500"
        >
          + Add Member
        </Link>
      </div>
      <div className={`p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-5 overflow-auto  ${darkMode ? 'text-white' : ' text-gray-400'} `}>
        {staffData.map((staff, index) => (
          <StaffCard key={index} {...staff} />
        ))}
      </div>
    </div>
  );
};

export default Staff;
