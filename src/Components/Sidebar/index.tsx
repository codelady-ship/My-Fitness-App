import React from 'react'
import Link from 'next/link'
import { Ilinks } from '../../../Interface/links'
const Sidebar = () => {
  
  return (
    <div className=' bg-blue-500 h-[calc(100vh-85px)] flex flex-col text-white p-5'>
      {links.map(({id,title,to} :Ilinks)=>{
        return( <Link href={to} key={id}>
          {title}</Link>)
        })
      } 
    </div>
  )
}

export default Sidebar
