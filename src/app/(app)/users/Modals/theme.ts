import Swal from "sweetalert2";
import { enhanceSelects } from "@/lib/listbox";

/** Shared SweetAlert2 colours and inline field styles for the member modals. */
export const swalTheme = (darkMode: boolean) => ({
  background: darkMode ? "#111827" : "#fff",
  color: darkMode ? "#f9fafb" : "#111827",
  confirmButtonColor: "#ff6a55",
});

export const fieldStyle = (darkMode: boolean) =>
  `width:100%;margin:0;box-sizing:border-box;padding:.6rem;border-radius:.5rem;border:1px solid ${
    darkMode ? "#4b5563" : "#d1d5db"
  };background:${darkMode ? "#1f2937" : "#fff"};color:inherit;font:inherit`;

export const labelStyle = "display:flex;flex-direction:column;gap:.25rem;text-align:left;font-size:.9rem;font-weight:600";

/** Call from `didOpen`: the form's selects get the Pulsa listbox instead of the browser's own option list. */
export const styleSelects = () => enhanceSelects(Swal.getHtmlContainer());
