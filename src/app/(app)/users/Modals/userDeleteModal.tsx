import Swal from "sweetalert2";
import useDataStore from "@/Store/DataStore";
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
  });
  if (!result.isConfirmed) return;
  useDataStore.getState().removeMember(id);
  Swal.fire({ title: "Deleted", icon: "success", timer: 1400, showConfirmButton: false, ...swalTheme(darkMode) });
};
