'use client';
import React from 'react'
import useSidebarStore from '../../../Store/SidebarStore'; 
const Users = () => {
  const { darkMode } = useSidebarStore();
  
  return (
    <div>
      <div className={`flex justify-between ${darkMode ? 'bg-black' : 'bg-yellow-50'} p-5 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}
      ><h2 className="text-2xl">Users</h2>
      </div>
          
         
    </div>
  )
}

export default Users