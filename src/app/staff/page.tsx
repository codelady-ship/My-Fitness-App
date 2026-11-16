"use client";
import React from "react";
import StaffCard from "./StaffCard";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";
import PageHeader from "../../Components/PageHeader";
import { showStaffForm, toast } from "./staffModal";

const Staff = () => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const { staff, ready, addStaff } = useDataStore();

  const addMember = async () => {
    const member = await showStaffForm(darkMode);
    if (!member) return;
    addStaff(member);
    toast(`${member.FName} ${member.Lname} was added`, darkMode);
  };

  return (
    <div>
      <PageHeader title="Staff">
        <button
          type="button"
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600"
          onClick={addMember}
        >
          + Add staff member
        </button>
      </PageHeader>

      {ready && staff.length === 0 && <p className="p-6">No staff yet. Add the first member with the button above.</p>}

      <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
        {staff.map((member) => (
          <StaffCard key={member.id} {...member} darkMode={darkMode} />
        ))}
      </ul>
    </div>
  );
};

export default Staff;
