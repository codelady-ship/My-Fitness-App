import Swal from "sweetalert2";
import { ICard } from "../../../../Interface/card";
import useDataStore from "../../../../Store/DataStore";
import { bindAvatarInput, DEFAULT_AVATAR, esc } from "../../../../lib/utils";
import { swalTheme, fieldStyle, labelStyle } from "./theme";

export const showEditUserModal = async (card: ICard, darkMode: boolean) => {
  const f = fieldStyle(darkMode);
  const input = (label: string, id: string, value: string | number, type = "text") =>
    `<label style="${labelStyle}">${label}<input id="eu-${id}" type="${type}" value="${esc(value)}" style="${f}"></label>`;
  const select = (label: string, id: string, value: string, options: [string, string][]) =>
    `<label style="${labelStyle}">${label}<select id="eu-${id}" style="${f}">${options
      .map(([v, t]) => `<option value="${v}" ${v === value ? "selected" : ""}>${t}</option>`)
      .join("")}</select></label>`;

  const result = await Swal.fire<ICard>({
    title: `Edit ${esc(card.fullName)}`,
    width: "40rem",
    ...swalTheme(darkMode),
    showCancelButton: true,
    confirmButtonText: "Save changes",
    focusConfirm: false,
    html: `
      <div style="display:grid;gap:.75rem">
        <label for="eu-image" style="cursor:pointer;justify-self:center;text-align:center;font-size:.85rem">
          <img id="eu-preview" src="${esc(card.image || DEFAULT_AVATAR)}" alt="Photo preview"
            style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:2px solid #f59e0b;display:block;margin:0 auto .3rem" />
          Change photo
        </label>
        <input id="eu-image" type="file" accept="image/*" style="display:none" />
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.75rem">
          ${input("Full name", "fullName", card.fullName)}
          ${input("Email", "email", card.email, "email")}
          ${input("Phone", "phone", card.phone, "tel")}
          ${select("Gender", "gender", card.gender, [["female", "Female"], ["male", "Male"]])}
          ${input("Birth date", "birthDate", card.birthDate, "date")}
          ${select("Status", "status", card.status, [["active", "Active"], ["passive", "Passive"], ["expired", "Expired"]])}
          ${select("Membership", "membershipType", card.membershipType, [["Monthly", "Monthly"], ["Year", "Year"]])}
          ${input("Remaining visits", "remainingAccesses", card.remainingAccesses, "number")}
          ${input("Start date", "startDate", card.startDate, "date")}
          ${input("End date", "endDate", card.endDate, "date")}
          ${input("Height (cm)", "height", card.height, "number")}
          ${input("Weight (kg)", "weight", card.weight, "number")}
          ${input("Goal", "goals", card.goals)}
          ${input("Coach", "coach", card.coach)}
        </div>
        <label style="${labelStyle}">Notes<textarea id="eu-notes" rows="3" style="${f}">${esc(card.notes)}</textarea></label>
        <label style="display:flex;align-items:center;gap:.5rem;font-weight:600">
          <input type="checkbox" id="eu-isBlacklisted" ${card.isBlacklisted ? "checked" : ""}> Blacklisted
        </label>
      </div>`,
    didOpen: () => bindAvatarInput("eu-image", "eu-preview"),
    preConfirm: () => {
      const val = (id: string) => (document.getElementById(`eu-${id}`) as HTMLInputElement).value.trim();
      const fullName = val("fullName");
      if (!fullName || !val("email")) {
        Swal.showValidationMessage("Name and email are required");
        return false;
      }
      const preview = document.getElementById("eu-preview") as HTMLImageElement;
      const updated: ICard = {
        ...card,
        owner: fullName,
        fullName,
        image: preview.dataset.changed ? preview.src : card.image,
        email: val("email"),
        phone: val("phone"),
        gender: val("gender") as ICard["gender"],
        birthDate: val("birthDate"),
        status: val("status") as ICard["status"],
        membershipType: val("membershipType") as ICard["membershipType"],
        remainingAccesses: Math.max(0, parseInt(val("remainingAccesses"), 10) || 0),
        startDate: val("startDate"),
        endDate: val("endDate"),
        height: parseInt(val("height"), 10) || card.height,
        weight: parseInt(val("weight"), 10) || card.weight,
        goals: val("goals"),
        coach: val("coach"),
        notes: (document.getElementById("eu-notes") as HTMLTextAreaElement).value,
        isBlacklisted: (document.getElementById("eu-isBlacklisted") as HTMLInputElement).checked,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    },
  });

  if (result.isConfirmed && result.value) {
    const { cards, setCards } = useDataStore.getState();
    setCards(cards.map((c) => (c.id === card.id ? result.value! : c)));
  }
};
