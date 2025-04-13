'use client';
import React from 'react';
import { staffData } from '../../../../Mock/staff'; 
import { IStaff } from '../../../../Interface/staff';
import { IoMdMale, IoMdFemale } from 'react-icons/io'; // React Icons
import { CiEdit } from 'react-icons/ci'; // React Icons
import { MdDeleteOutline } from 'react-icons/md'; // React Icons
import Swal from 'sweetalert2'; // SweetAlert2 import
import useSidebarStore from '../../../../Store/SidebarStore';
interface Iprops {
  params: { id: string };
}

const StaffDetail = ({ params }: Iprops) => {
  const { darkMode } = useSidebarStore();
  const { id } = params;  
  const staffMember = staffData.find((s) => s.id === id);  // id müqayisə edilir

  if (!staffMember) {
    return (
      <div className="p-5">
        <p>Staff not found.</p>
      </div>
    );
  }

  const { image, FName, Lname, email, tel, jobType, birth, gender }: IStaff | undefined = staffMember;

  // Silmə funksiyası
  const handleDelete = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${FName} ${Lname}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      background: darkMode ? 'black' : 'white', 
      color: darkMode ? 'white' : 'black',      
    }).then((result) => {
      if (result.isConfirmed) {
        // Silmə əməliyyatı burada edilir
        Swal.fire(
          'Deleted!',
          `${FName} ${Lname} has been deleted.`,
          'success'
        );
        // Silmək üçün daha sonra kod əlavə edin
      }
    });
  };

    //edit kart
   const handleEdit = () => {
    Swal.fire({
      title: 'Edit Staff',
       width:"40vw",
      html: `
       <div style="display: flex; flex-direction: column; align-items: center; ">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <img id="avatarPreview" src="${image || '/default-avatar.png'}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; object-cover; border: 2px solid #ccc; margin-bottom: 10px;" />
          <input type="file" id="imageUpload" accept="image/*" placeholder="Choose file" class="swal2-input" style="padding-top: 5px;" />
        </div>
        <input type="text" id="fname" class="swal2-input border" placeholder="First Name" value="${FName}">
        <input type="text" id="lname" class="swal2-input border" placeholder="Last Name" value="${Lname}">
        <input type="email" id="email" class="swal2-input border" placeholder="Email" value="${email}">
        <input type="tel" id="tel" class="swal2-input border" placeholder="Phone" value="${tel}">
        <input type="date" id="birth" class="swal2-input" value="${birth}">
        <div style="flex space-x-5">
         <select id="jobType" class="swal2-input border border-gray-300 my-3">
          <option value="Trainer" ${jobType === "Trainer" ? 'selected' : ''}>Trainer</option>
          <option value="Instructor" ${jobType === "Instructor" ? 'selected' : ''}>Instructor</option>
          <option value="Manager" ${jobType === "Manager" ? 'selected' : ''}>Manager</option>
          <option value="Receptionist" ${jobType === "Receptionist" ? 'selected' : ''}>Receptionist</option>
         </select>
        
         <select id="gender" class="swal2-input border border-gray-300 my-5">
          <option value="male" ${gender.toLowerCase() === 'male' ? 'selected' : ''}>👨 Male</option>
          <option value="female" ${gender.toLowerCase() === 'female' ? 'selected' : ''}>👩 Female</option>
         </select>
        </div>
       </div>
      `,
      willOpen: () => {
        const imageInput = document.getElementById('imageUpload') as HTMLInputElement;
        const avatarPreview = document.getElementById('avatarPreview') as HTMLImageElement;
  
        imageInput?.addEventListener('change', () => {
          const file = imageInput.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              avatarPreview.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
          }
        });
      },
      preConfirm: () => {
        const updatedFName = (document.getElementById('fname') as HTMLInputElement).value;
        const updatedLName = (document.getElementById('lname') as HTMLInputElement).value;
        const updatedEmail = (document.getElementById('email') as HTMLInputElement).value;
        const updatedTel = (document.getElementById('tel') as HTMLInputElement).value;
        const updatedJobType = (document.getElementById('jobType') as HTMLSelectElement).value;
        const updatedBirth = (document.getElementById('birth') as HTMLInputElement).value;
        const updatedGender = (document.getElementById('gender') as HTMLSelectElement).value;
        const updatedImage = (document.getElementById('avatarPreview') as HTMLImageElement).src;
  
        if (!updatedFName || !updatedLName || !updatedEmail || !updatedTel || !updatedJobType || !updatedBirth) {
          Swal.showValidationMessage('Please fill all fields');
        } else {
          Swal.fire(
            'Updated!',
            `${updatedFName} ${updatedLName} has been updated.`,
            'success'
          );
          
        }
      },
      focusCancel: true,
      background: darkMode ? 'black' : 'white',
      color: darkMode ? 'white' : 'black',
    });
  };
  
  return (
    <div>
      {/* Header */}
      <div className={`flex justify-between py-5 px-10 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}>
        <h2 className="text-2xl">Staff Detail </h2>
        <div className='text-3xl flex space-x-6'>
          <CiEdit className='cursor-pointer text-yellow-500' onClick={handleEdit} /> 
          <MdDeleteOutline className='cursor-pointer text-red-500' onClick={handleDelete} />
        </div>
      </div>
      
      {/* Staff Detail Section */}
      <div className="px-15 py-5 lg:mx-40" >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-x-6 p-8  border border-amber-700 ">
          <div className='py-5'>
            <div className="flex space-x-6">
              <h3 className="text-3xl font-bold">{FName} {Lname}</h3>
              {/* Gender İkonu */}
              <div>
                {gender.toLowerCase() === "male" ? (
                  <IoMdMale className="text-blue-500 text-3xl" />
                ) : gender.toLowerCase() === "female" ? (
                  <IoMdFemale className="text-pink-500 text-3xl" />
                ) : null}
              </div>
            </div>
            <p className="mt-2 font-bold text-2xl">Email: {email}</p>
            <p className="font-bold text-2xl">Phone: {tel}</p>
            <p className="font-bold text-2xl">Job: {jobType}</p>
            <p className="font-bold text-2xl">Birthday: {birth}</p>
          </div>
          <img
            src={image}
            alt={`${FName} ${Lname}`}
            className="w-30 h-30 sm:w-50 sm:h-50 object-cover border border-amber-700 mb-4 sm:mb-0 lg:ml-100"
            width={200} 
            height={200} 
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
