import Swal from "sweetalert2";

export const showDeleteUserModal = (
  id: string,
  setCards: (cards: any[]) => void,
  cards: any[],
  darkMode: boolean
) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This user will be permanently deleted.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'No, cancel!',
    customClass: {
      popup: darkMode ? 'swal-dark' : '',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      setCards(cards.filter((card) => card.id !== id));
      Swal.fire({
        title: 'Deleted!',
        text: 'The user has been deleted.',
        icon: 'success',
        customClass: {
          popup: darkMode ? 'swal-dark' : '',
        },
      });
    }
  });
};
