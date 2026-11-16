import Swal from "sweetalert2";
import { ICard } from "../../../../Interface/card";
import { showEditUserModal } from "./userEditModal";
import { showDeleteUserModal } from "./userDeleteModal";
import { esc, formatDate } from "../../../../lib/utils";
import { swalTheme } from "./theme";

export const showUserCardModal = async (card: ICard, darkMode: boolean) => {
  const rows: [string, string][] = [
    ["Gender", card.gender === "male" ? "Male" : "Female"],
    ["Birth date", formatDate(card.birthDate) || "Not set"],
    ["Email", card.email],
    ["Phone", card.phone || "Not set"],
    ["Membership", `${card.membershipType} (${formatDate(card.startDate)} to ${formatDate(card.endDate)})`],
    ["Remaining visits", String(card.remainingAccesses)],
    ["Last visit", formatDate(card.lastVisit, true)],
    ["Height / weight", `${card.height} cm / ${card.weight} kg`],
    ["Goal", card.goals],
    ["Coach", card.coach || "None"],
    ["Notes", card.notes || "None"],
    ["Blacklisted", card.isBlacklisted ? "Yes" : "No"],
  ];

  const result = await Swal.fire({
    title: esc(card.fullName),
    width: "34rem",
    ...swalTheme(darkMode),
    html: `<dl style="display:grid;grid-template-columns:auto 1fr;gap:.35rem 1rem;text-align:left;margin:0">${rows
      .map(([k, v]) => `<dt style="font-weight:600">${k}</dt><dd style="margin:0;overflow-wrap:anywhere">${esc(v)}</dd>`)
      .join("")}</dl>`,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Edit",
    denyButtonText: "Delete",
    cancelButtonText: "Close",
  });

  if (result.isConfirmed) showEditUserModal(card, darkMode);
  else if (result.isDenied) showDeleteUserModal(card.id, darkMode);
};
