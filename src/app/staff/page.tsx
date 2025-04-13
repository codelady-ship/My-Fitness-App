'use client';
import React from 'react';
import { staffData } from '../../../Mock/staff'; 
import StaffCard from './StaffCard';
import useSidebarStore from '../../../Store/SidebarStore'; 
import Swal from 'sweetalert2';

const Staff = () => {
  const { darkMode } = useSidebarStore();

  const addMember = () => {
    const FName = "";
    const Lname = "";
    const email = "";
    const tel = "";
    const birth = "";
    const jobType = "Trainer";
    const gender = "male";
    const image = "";

    Swal.fire({
      title: 'Add New Staff',
      width: "40vw",
      html: `
      <style>
        .swal-form-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .swal-form-row {
          display: flex;
          gap: 10px;
          width: 100%;
          justify-content: space-between;
        }
        .swal-form-input {
          width: 100%;
          margin: 8px 0;
          padding: 10px;
          border-radius: 5px;
          border: 1.5px solid ${darkMode ? '#666' : '#ccc'};
          background-color: ${darkMode ? '#1a1a1a' : '#fff'};
          color: ${darkMode ? '#f0f0f0' : '#000'};
        }
        .swal-avatar-preview {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid ${darkMode ? '#888' : '#000'};
          margin-bottom: 10px;
        }
        ::placeholder {
          color: ${darkMode ? '#aaa' : '#999'};
        }
        select.swal-form-input option {
          background-color: ${darkMode ? '#1a1a1a' : '#fff'};
          color: ${darkMode ? '#fff' : '#000'};
        }
      </style>
      <div class="swal-form-container">
        <img id="avatarPreview" src="${image || '/default-avatar.png'}" alt="Avatar" class="swal-avatar-preview" />
        <input type="file" id="imageUpload" accept="image/*" class="swal2-input swal-form-input" />
        
        <div class="swal-form-row">
          <input type="text" id="fname" class="swal2-input swal-form-input" placeholder="First Name" value="${FName}">
          <input type="text" id="lname" class="swal2-input swal-form-input" placeholder="Last Name" value="${Lname}">
        </div>
    
        <input type="email" id="email" class="swal2-input swal-form-input" placeholder="Email" value="${email}">
        <input type="tel" id="tel" class="swal2-input swal-form-input" placeholder="Phone" value="${tel}">
        
        <div class="swal-form-row">
          <input type="text" id="jobType" class="swal2-input swal-form-input" placeholder="Job Type" value="${jobType}">
          <input type="date" id="birth" class="swal2-input swal-form-input" value="${birth}">
        </div>
    
        <select id="gender" class="swal2-input swal-form-input">
          <option value="male">👨 Male</option>
          <option value="female">👩 Female</option>
        </select>
      </div>
    `
    
,
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
        const updatedBirth = (document.getElementById('birth') as HTMLInputElement).value;
        const updatedJobType = (document.getElementById('jobType') as HTMLSelectElement).value;
        const updatedGender = (document.getElementById('gender') as HTMLSelectElement).value;
        const updatedImage = (document.getElementById('avatarPreview') as HTMLImageElement).src;

        if (!updatedFName || !updatedLName || !updatedEmail || !updatedTel || !updatedBirth) {
          Swal.showValidationMessage('Please fill all required fields');
          return false;
        }


        Swal.fire(
          'Member Added!',
          `${updatedFName} ${updatedLName} has been added.`,
          'success'
        );
      },
      background: darkMode ? 'black' : 'white',
      color: darkMode ? 'white' : 'black',
      focusCancel: true,
    });
  };

  return (
    <div>
      <div
        className={`flex justify-between ${
          darkMode ? 'bg-black' : 'bg-yellow-50'
        } p-5 border border-b-amber-700 font-bold text-xl sticky top-0 z-10`}
      >
        <h2 className="text-2xl">Staff</h2>
        <button
          className="border border-amber-700 py-1 px-2 hover:text-amber-500"
          onClick={addMember}
        >
          + Add New Member
        </button>
      </div>
      <div
        className={`p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-5 overflow-auto ${
          darkMode ? 'text-white' : 'text-gray-400'
        }`}
      >
        {staffData.map((staff, index) => (
          <StaffCard key={index} {...staff} />
        ))}
      </div>
    </div>
  );
};

export default Staff;
