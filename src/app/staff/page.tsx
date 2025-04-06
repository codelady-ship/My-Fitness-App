import React from 'react';
import Link from 'next/link';
import { stafData } from '../../../Mock/staff'; 
import Image from 'next/image';

const Staff = () => {
  return (
    <div>
      <div className='flex justify-between p-5 bg-amber-50 font-bold text-xl'>
        <h2>Staff</h2>
        <Link href="/create-staff" className="border border-amber-700 py-1 px-2">+ Add Member</Link>
      </div>
      
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-5">
        {stafData.map(({ id, image, FName, Lname, jobType }) => (
          <div key={id} className="relative p-4 border border-amber-700 rounded-lg shadow-lg">
            <Image
              src={image}
              alt={`${FName} ${Lname}`}
              className="w-24 h-24 object-cover rounded-full mx-auto"
              width={96}
              height={96}
            />
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold">{FName} {Lname}</h3>
              <p className="text-gray-600">Job: {jobType}</p>
            </div>

            {/* staff carda vuranda ozu detaile */}
            <Link href={`/staff/${id}`} className="absolute inset-0"></Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;
