import React from 'react'
import Image from 'next/image';
import Link from 'next/link';
const StaffCard = ({ id, image, FName, Lname, jobType }:any) => {
  return (
    <div key={id} className="relative p-4 border border-amber-700 rounded-lg shadow-lg">
            {/* staff carda vuranda ozu detaile */}
            <Link href={`/staff/${id}`} className="absolute inset-0"></Link>
            
            <Image
              src={image}
              alt={`${FName} ${Lname}`}
              className="w-24 h-24 object-cover mx-auto"
              width={96}
              height={96}
            />
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold">{FName} {Lname}</h3>
              <p className="text-gray-600 font-semibold">Job: {jobType}</p>
            </div>
          </div>
  )
}

export default StaffCard
