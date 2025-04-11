import React from 'react';
import { staffData } from '../../../../Mock/staff'; 

import { IStaff } from '../../../../Interface/staff';

interface Iprops {
  params: { id: string };
}

const StaffDetail = ({ params }: Iprops) => {
  const { id } = params;  
  
  const staffMember = staffData.find((s) => s.id === id);  // `id` string olaraq müqayisə edilir

  if (!staffMember) {
    return (
      <div className="p-5">
        <p>Staff not found.</p>
      </div>
    );
  }

  const { image, FName, Lname, email, tel, jobType }: IStaff | undefined = staffMember;

  return (
    <div>
      {/* Header */}
      <div className={`flex justify-between p-5 border-b-amber-700 font-bold text-xl sticky top-0 z-10`}>
        <h2 className="text-2xl">Staff Detail</h2>
      </div>
      
      {/* Staff Detail Section */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-x-4 sm:space-x-6 p-4 border-b">
          <img
            src={image}
            alt={`${FName} ${Lname}`}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-4 sm:mb-0"
            width={128} 
            height={128} 
          />
          <div>
            <h3 className="text-2xl font-semibold">{FName} {Lname}</h3>
            <p className="text-gray-600 mt-2">Email: {email}</p>
            <p className="text-gray-600">Phone: {tel}</p>
            <p className="text-gray-600">Job: {jobType}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
