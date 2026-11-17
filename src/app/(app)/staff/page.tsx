"use client";
import React from "react";
import StaffCard from "./StaffCard";
import useSidebarStore from "@/Store/SidebarStore";
import useDataStore from "@/Store/DataStore";
import PageHeader from "@/src/Components/PageHeader";
import { showStaffForm, toast } from "./staffModal";

const Staff = () => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const { staff, ready, addStaff } = useDataStore();

  const addMember = async () => {
    const member = await showStaffForm(darkMode, undefined, addStaff);
    if (!member) return;
    toast(`${member.FName} ${member.Lname} was added`, darkMode);
  };

  return (
    <div>
      <PageHeader title="Staff">
        <button type="button" className="btn btn-coral btn-sm" onClick={addMember}>
          + Add staff member
        </button>
      </PageHeader>

      {ready && staff.length === 0 && <p className="glass panel">No staff yet. Add the first member with the button above.</p>}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {staff.map((member) => (
          <StaffCard key={member.id} {...member} darkMode={darkMode} />
        ))}
      </ul>
    </div>
  );
};

export default Staff;
