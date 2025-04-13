import Swal from "sweetalert2";
import { showEditUserModal } from "./userEditModal";
import { showDeleteUserModal } from "./userDeleteModal";

export const showUserCardModal = (
  card: any,
  setCards: any,
  cards: any[],
  darkMode: boolean
) => {
  Swal.fire({
    title: `${card.fullName} - Details`,
    html: `
      <b>Gender:</b> ${card.gender}<br>
      <b>Birth Date:</b> ${card.birthDate}<br>
      <b>Email:</b> ${card.email}<br>
      <b>Phone:</b> ${card.phone}<br>
      <b>Membership:</b> ${card.membershipType}<br>
      <b>Last Visit:</b> ${card.lastVisit}<br>
      <b>Height:</b> ${card.height} cm<br>
      <b>Weight:</b> ${card.weight} kg<br>
      <b>Goals:</b> ${card.goals}<br>
      <b>Coach:</b> ${card.coach}<br>
      <b>Notes:</b> ${card.notes}<br>
      <b>Blacklisted:</b> ${card.isBlacklisted ? 'Yes' : 'No'}<br>
    `,
    showCancelButton: true,
    confirmButtonText: 'Edit',
    cancelButtonText: 'Delete',
    customClass: {
      popup: darkMode ? 'swal-dark' : '',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      showEditUserModal(card, setCards, cards, darkMode);
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      showDeleteUserModal(card.id, setCards, cards, darkMode);
    }
  });
};