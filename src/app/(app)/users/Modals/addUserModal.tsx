import Swal from "sweetalert2";
import { ICard } from "@/Interface/card";
import useDataStore from "@/Store/DataStore";
import { bindAvatarInput, daysAgo, DEFAULT_AVATAR, esc } from "@/lib/utils";
import { swalTheme, fieldStyle, labelStyle } from "./theme";

export const showAddUserModal = async (darkMode: boolean) => {
  const f = fieldStyle(darkMode);
  const coaches = useDataStore
    .getState()
    .staff.filter((s) => s.jobType === "Trainer" || s.jobType === "Instructor")
    .map((s) => `${s.FName} ${s.Lname}`);

  const result = await Swal.fire<ICard>({
    title: "Add new member",
    width: "36rem",
    ...swalTheme(darkMode),
    showCancelButton: true,
    confirmButtonText: "Add member",
    focusConfirm: false,
    html: `
      <div style="display:grid;gap:.75rem">
        <label for="au-image" style="cursor:pointer;justify-self:center;text-align:center;font-size:.85rem">
          <img id="au-preview" src="${DEFAULT_AVATAR}" alt="Photo preview"
            style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:2px solid #ff6a55;display:block;margin:0 auto .3rem" />
          Add photo (optional)
        </label>
        <input id="au-image" type="file" accept="image/*" style="display:none" />
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.75rem">
          <label style="${labelStyle}">Full name<input id="au-name" style="${f}" autocomplete="off"></label>
          <label style="${labelStyle}">Email<input id="au-email" type="email" style="${f}"></label>
          <label style="${labelStyle}">Phone<input id="au-phone" type="tel" style="${f}"></label>
          <label style="${labelStyle}">Gender
            <select id="au-gender" style="${f}"><option value="female">Female</option><option value="male">Male</option></select>
          </label>
          <label style="${labelStyle}">Height (cm)<input id="au-height" type="number" min="100" max="250" style="${f}"></label>
          <label style="${labelStyle}">Weight (kg)<input id="au-weight" type="number" min="30" max="250" style="${f}"></label>
          <label style="${labelStyle}">Membership
            <select id="au-type" style="${f}"><option value="Monthly">Monthly</option><option value="Year">Year</option></select>
          </label>
          <label style="${labelStyle}">Coach
            <select id="au-coach" style="${f}">${coaches.map((c) => `<option>${esc(c)}</option>`).join("")}<option value="">No coach</option></select>
          </label>
        </div>
        <label style="${labelStyle}">Goal<input id="au-goals" style="${f}" placeholder="e.g. Lose weight"></label>
      </div>`,
    didOpen: () => bindAvatarInput("au-image", "au-preview"),
    preConfirm: () => {
      const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();
      const fullName = val("au-name");
      const email = val("au-email");
      const height = parseInt(val("au-height"), 10);
      const weight = parseInt(val("au-weight"), 10);
      const goals = val("au-goals");
      if (!fullName || !email || !height || !weight || !goals) {
        Swal.showValidationMessage("Please fill in name, email, height, weight and goal");
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        Swal.showValidationMessage("Please enter a valid email");
        return false;
      }
      const preview = document.getElementById("au-preview") as HTMLImageElement;
      const membershipType = val("au-type") as ICard["membershipType"];
      const now = new Date().toISOString();
      const card: ICard = {
        id: "C" + Date.now().toString().slice(-6),
        owner: fullName,
        fullName,
        image: preview.dataset.changed ? preview.src : "",
        remainingAccesses: membershipType === "Year" ? 30 : 10,
        status: "active",
        lastUsed: now,
        lastVisit: now,
        gender: val("au-gender") as ICard["gender"],
        birthDate: "",
        email,
        phone: val("au-phone"),
        membershipType,
        startDate: daysAgo(0),
        endDate: daysAgo(membershipType === "Year" ? -365 : -30),
        height,
        weight,
        goals,
        coach: val("au-coach"),
        checkInHistory: [],
        notes: "",
        isBlacklisted: false,
        createdAt: now,
        updatedAt: now,
      };
      return card;
    },
  });

  if (result.isConfirmed && result.value) {
    useDataStore.getState().addMember(result.value);
  }
};
