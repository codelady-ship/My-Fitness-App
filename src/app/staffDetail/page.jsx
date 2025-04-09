import React from 'react'


'use client';
import React from 'react'
import useSidebarStore from '../../../Store/SidebarStore'; 
const staffDetail = () => {
  const { darkMode } = useSidebarStore();
  
  return (
    <div>
      <div className={`flex justify-between ${darkMode ? 'bg-black' : 'bg-yellow-50'} p-5 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}
      ><h2 className="text-2xl">Staff Detail</h2>
      </div>
          
         
    </div>
  )
}

export default staffDetail
