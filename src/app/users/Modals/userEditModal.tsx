import Swal from "sweetalert2";
import { ICard } from '../../../../Interface/card';

export const showEditUserModal = (
  card: ICard,
  setCards: (cards: ICard[]) => void,
  cards: ICard[],
  darkMode: boolean
) => {
  Swal.fire({
    title: `<span style="font-size: 1.5rem; font-weight: bold;">Edit ${card.fullName}</span>`,
    html: `
      <div style="display: grid; gap: 10px; text-align: left;">
      <div style="text-align: center; margin-left:85px ">
          <label for="imageUpload" style="display: block; cursor: pointer;">
            <img 
              id="avatarPreview" 
              src="/default-avatar.jpg" 
              alt="Add photo" 
              style="width: 120px; height: 120px; object-fit: cover; border: 2px solid #ccc; margin-left: 120px;" 
            />
          </label>
          <input 
            type="file" 
            id="imageUpload" 
            accept="image/*" 
            class="swal2-input swal-form-input" 
            style="display: none;" 
          />
        </div>
        ${inputField('Owner', 'owner', card.owner, 'text')}
        ${inputField('Full Name', 'fullName', card.fullName, 'text')}
        ${inputField('Email', 'email', card.email, 'email')}
        ${inputField('Phone', 'phone', card.phone, 'text')}
        ${selectField('Gender', 'gender', card.gender)}
        ${inputField('Birth Date', 'birthDate', card.birthDate, 'date')}
        ${inputField('Membership Type', 'membershipType', card.membershipType, 'text')}
        ${inputField('Start Date', 'startDate', card.startDate, 'date')}
        ${inputField('End Date', 'endDate', card.endDate, 'date')}
        ${inputField('Height (cm)', 'height', card.height, 'number')}
        ${inputField('Weight (kg)', 'weight', card.weight, 'number')}
        ${inputField('Goals', 'goals', card.goals, 'text')}
        ${inputField('Coach', 'coach', card.coach, 'text')}
        <label for="notes"><strong>Notes:</strong></label>
        <textarea id="notes" class="swal2-textarea ${darkMode ? 'swal-dark-input' : ''}">${card.notes}</textarea>
        <label style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
          <input type="checkbox" id="isBlacklisted" ${card.isBlacklisted ? 'checked' : ''}> <strong>Blacklisted</strong>
        </label>
      </div>
    `,
    preConfirm: () => {
      const updatedCard: any = {
        ...card,
        owner: (document.getElementById("owner") as HTMLInputElement).value,
        fullName: (document.getElementById("fullName") as HTMLInputElement).value,
        email: (document.getElementById("email") as HTMLInputElement).value,
        phone: (document.getElementById("phone") as HTMLInputElement).value,
        gender: (document.getElementById("gender") as HTMLSelectElement).value,
        birthDate: (document.getElementById("birthDate") as HTMLInputElement).value,
        membershipType: (document.getElementById("membershipType") as HTMLInputElement).value,
        startDate: (document.getElementById("startDate") as HTMLInputElement).value,
        endDate: (document.getElementById("endDate") as HTMLInputElement).value,
        height: parseInt((document.getElementById("height") as HTMLInputElement).value),
        weight: parseInt((document.getElementById("weight") as HTMLInputElement).value),
        goals: (document.getElementById("goals") as HTMLInputElement).value,
        coach: (document.getElementById("coach") as HTMLInputElement).value,
        notes: (document.getElementById("notes") as HTMLTextAreaElement).value,
        isBlacklisted: (document.getElementById("isBlacklisted") as HTMLInputElement).checked,
        updatedAt: new Date().toISOString(),
      };
      setCards(cards.map((c) => (c.id === card.id ? updatedCard : c)));
    },
    customClass: {
      popup: darkMode ? 'swal-dark' : '',
    },
    confirmButtonText: 'Save Changes',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
  });
};

// Reusable input generator
const inputField = (label: string, id: string, value: string | number, type: string) => {
  return `
    <label for="${id}"><strong>${label}:</strong></label>
    <input type="${type}" id="${id}" value="${value}" class="swal2-input ${type === 'date' ? 'swal2-date' : ''} ${type === 'number' ? 'swal2-number' : ''}" />
  `;
};

// Gender select input
const selectField = (label: string, id: string, selected: string) => {
  return `
    <label for="${id}"><strong>${label}:</strong></label>
    <select id="${id}" class="swal2-input">
      <option value="male" ${selected === 'male' ? 'selected' : ''}>Male</option>
      <option value="female" ${selected === 'female' ? 'selected' : ''}>Female</option>
    </select>
  `;
};
