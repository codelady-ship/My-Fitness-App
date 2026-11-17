import Swal from "sweetalert2";
import useDataStore, { writeErrorMessage } from "@/Store/DataStore";
import { swalTheme } from "./theme";

export const showDeleteUserModal = async (id: string, darkMode: boolean) => {
  const result = await Swal.fire({
    title: "Delete this member?",
    text: "The member and their card will be removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    ...swalTheme(darkMode),
    confirmButtonColor: "#dc2626",
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    // Delete on the server first; the member only disappears from the list after it succeeds.
    preConfirm: async () => {
      try {
        await useDataStore.getState().removeMember(id);
        return true;
      } catch (err) {
        Swal.showValidationMessage(writeErrorMessage(err));
        return false;
      }
    },
  });
  if (!result.isConfirmed) return;
  Swal.fire({ title: "Deleted", icon: "success", timer: 1400, showConfirmButton: false, ...swalTheme(darkMode) });
};
