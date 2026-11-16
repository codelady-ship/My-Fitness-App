import Swal from "sweetalert2";
import { IStaff } from "../../../Interface/staff";
import { JOB_TYPES } from "../../../Mock/staff";
import { bindAvatarInput, DEFAULT_AVATAR, esc } from "../../../lib/utils";

/**
 * Add / edit form for a staff member in a SweetAlert2 popup.
 * Resolves with the saved member, or null if the popup was cancelled.
 */
export const showStaffForm = async (darkMode: boolean, member?: IStaff): Promise<IStaff | null> => {
  const m: Partial<IStaff> = member ?? { gender: "female", jobType: "Trainer" };
  const field = `width:100%;margin:0;box-sizing:border-box;padding:.6rem;border-radius:.5rem;border:1px solid ${
    darkMode ? "#4b5563" : "#d1d5db"
  };background:${darkMode ? "#1f2937" : "#fff"};color:inherit;font:inherit`;
  const label = "display:flex;flex-direction:column;gap:.25rem;text-align:left;font-size:.9rem;font-weight:600";

  const result = await Swal.fire<IStaff>({
    title: member ? `Edit ${esc(m.FName)} ${esc(m.Lname)}` : "Add staff member",
    width: "36rem",
    background: darkMode ? "#111827" : "#fff",
    color: darkMode ? "#f9fafb" : "#111827",
    showCancelButton: true,
    confirmButtonText: member ? "Save changes" : "Add member",
    confirmButtonColor: "#d97706",
    focusConfirm: false,
    html: `
      <div style="display:grid;gap:.75rem">
        <label for="sf-image" style="cursor:pointer;justify-self:center;text-align:center;font-size:.85rem">
          <img id="sf-preview" src="${esc(m.image || DEFAULT_AVATAR)}" alt="Photo preview"
            style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:2px solid #f59e0b;display:block;margin:0 auto .3rem" />
          Change photo
        </label>
        <input id="sf-image" type="file" accept="image/*" style="display:none" />
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.75rem">
          <label style="${label}">First name<input id="sf-fname" style="${field}" value="${esc(m.FName)}" autocomplete="off"></label>
          <label style="${label}">Last name<input id="sf-lname" style="${field}" value="${esc(m.Lname)}" autocomplete="off"></label>
          <label style="${label}">Email<input id="sf-email" type="email" style="${field}" value="${esc(m.email)}"></label>
          <label style="${label}">Phone<input id="sf-tel" type="tel" style="${field}" value="${esc(m.tel)}"></label>
          <label style="${label}">Birthday<input id="sf-birth" type="date" style="${field}" value="${esc(m.birth)}"></label>
          <label style="${label}">Job
            <select id="sf-job" style="${field}">
              ${JOB_TYPES.map((j) => `<option ${m.jobType === j ? "selected" : ""}>${j}</option>`).join("")}
            </select>
          </label>
          <label style="${label}">Gender
            <select id="sf-gender" style="${field}">
              <option value="female" ${m.gender === "female" ? "selected" : ""}>Female</option>
              <option value="male" ${m.gender === "male" ? "selected" : ""}>Male</option>
            </select>
          </label>
        </div>
      </div>`,
    didOpen: () => bindAvatarInput("sf-image", "sf-preview"),
    preConfirm: () => {
      const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();
      const preview = document.getElementById("sf-preview") as HTMLImageElement;
      const data: IStaff = {
        id: member?.id ?? Date.now().toString(36),
        FName: val("sf-fname"),
        Lname: val("sf-lname"),
        email: val("sf-email"),
        tel: val("sf-tel"),
        birth: val("sf-birth"),
        jobType: val("sf-job"),
        gender: val("sf-gender") as IStaff["gender"],
        image: preview.dataset.changed ? preview.src : (member?.image ?? ""),
      };
      if (!data.FName || !data.Lname || !data.email || !data.tel || !data.birth) {
        Swal.showValidationMessage("Please fill in all fields");
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        Swal.showValidationMessage("Please enter a valid email");
        return false;
      }
      return data;
    },
  });

  return result.isConfirmed && result.value ? result.value : null;
};

export const toast = (title: string, darkMode: boolean) =>
  Swal.fire({
    title,
    icon: "success",
    timer: 1600,
    showConfirmButton: false,
    background: darkMode ? "#111827" : "#fff",
    color: darkMode ? "#f9fafb" : "#111827",
  });
