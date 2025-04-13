// components/userModals/addUserModal.ts
import Swal from "sweetalert2";

export const showAddUserModal = (
  setCards: (cards: any[]) => void,
  cards: any[],
  darkMode: boolean
) => {
  Swal.fire({
    title: 'Add New User',
    html: `
      <input type="text" id="fullName" class="swal2-input" placeholder="Full Name">
      <input type="email" id="email" class="swal2-input" placeholder="Email">
      <input type="number" id="height" class="swal2-input" placeholder="Height">
      <input type="number" id="weight" class="swal2-input" placeholder="Weight">
      <input type="text" id="goals" class="swal2-input" placeholder="Goals">
    `,
    preConfirm: () => {
      const newCard = {
        id: "C" + Math.floor(Math.random() * 1000000),
        owner: (document.getElementById('fullName') as HTMLInputElement).value,
        image: '/default-avatar.jpg',
        remainingAccesses: 10,
        status: 'active',
        lastUsed: new Date().toISOString(),
        fullName: (document.getElementById('fullName') as HTMLInputElement).value,
        gender: 'male',
        birthDate: '1990-01-01',
        email: (document.getElementById('email') as HTMLInputElement).value,
        phone: '+994500000000',
        membershipType: 'Year',
        startDate: '2025-04-01',
        endDate: '2026-04-01',
        lastVisit: new Date().toISOString(),
        height: parseInt((document.getElementById('height') as HTMLInputElement).value),
        weight: parseInt((document.getElementById('weight') as HTMLInputElement).value),
        goals: (document.getElementById('goals') as HTMLInputElement).value,
        coach: 'Coach Name',
        checkInHistory: [],
        notes: '',
        isBlacklisted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCards([...cards, newCard]);
    },
    customClass: {
      popup: darkMode ? 'swal-dark' : '',
    },
  });
};
