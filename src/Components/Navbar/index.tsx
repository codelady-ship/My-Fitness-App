import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
const Navbar = () => {
  return (
    <div className="px-5 bg-blue-500">
    <div className='flex justify-between h-[80px] text-amber-2xl '>
      <Link href='/' className='font-bold text-amber-2xl mt-2 text'>My Fitness App</Link>
      <div className='flex items-center gap-2'>
        <Image src="/images.jpg" alt='user-avatar' width={60} height={60} className='rounded-full border-3 border-b-pink-50'/>
        <p className='font-bold'>User Name</p>
      </div>
    </div>
    </div>
  )
}

export default Navbar
