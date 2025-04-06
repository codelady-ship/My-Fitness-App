import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
const Navbar = () => {
  return (
    <div className="px-5 py-1 border border-b-amber-700 sticky top-0">
    <div className='flex justify-between h-[80px]'>
    <Link href='/' className='m-2'>
          <Image src='/logo.jpg' width={150} height={100} alt="Logo" className="mb-1" />
        </Link>
      <div className='flex items-center gap-2'>
        <Image src="/images.jpg" alt='user-avatar' width={60} height={60} className='rounded-full border-3 border-b-pink-50'/>
        <p className='font-bold text-2xl'>User Name</p>
      </div>
    </div>
    </div>
  )
}

export default Navbar
