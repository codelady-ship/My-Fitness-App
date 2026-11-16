"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { IoMdMale, IoMdFemale } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { MdDeleteOutline } from "react-icons/md";
import useSidebarStore from "../../../../Store/SidebarStore";
import useDataStore from "../../../../Store/DataStore";
import PageHeader from "../../../Components/PageHeader";
import Avatar from "../../../Components/Avatar";
import { formatDate } from "../../../../lib/utils";
import { showStaffForm, toast } from "../staffModal";

const StaffDetail = () => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const { staff, ready, updateStaff, removeStaff } = useDataStore();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const member = staff.find((s) => s.id === id);

  useEffect(() => {
    if (member) document.title = `${member.FName} ${member.Lname} | My Fitness`;
  }, [member]);

  if (!ready) return <PageHeader title="Staff member" />;

  if (!member) {
    return (
      <div>
        <PageHeader title="Staff member not found" />
        <p className="p-6">
          This staff member does not exist or was deleted.{" "}
          <Link href="/staff" className="font-semibold text-amber-600 underline">
            Back to staff
          </Link>
        </p>
      </div>
    );
  }

  const { image, FName, Lname, email, tel, jobType, birth, gender } = member;
  const fullName = `${FName} ${Lname}`;

  const handleDelete = async () => {
    const r = await Swal.fire({
      title: "Delete this staff member?",
      text: `${fullName} will be removed from the list.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Keep",
      confirmButtonColor: "#dc2626",
      background: darkMode ? "#111827" : "#fff",
      color: darkMode ? "#f9fafb" : "#111827",
    });
    if (!r.isConfirmed) return;
    router.push("/staff");
    removeStaff(member.id);
    toast(`${fullName} was deleted`, darkMode);
  };

  const handleEdit = async () => {
    const updated = await showStaffForm(darkMode, member);
    if (!updated) return;
    updateStaff(updated);
    toast("Changes saved", darkMode);
  };

  const muted = darkMode ? "text-gray-400" : "text-gray-600";

  return (
    <div>
      <PageHeader title="Staff member">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1 rounded-lg border border-amber-500 px-3 py-1.5 font-semibold text-amber-600 hover:bg-amber-50"
          >
            <CiEdit className="text-xl" /> Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 rounded-lg border border-red-500 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-50"
          >
            <MdDeleteOutline className="text-xl" /> Delete
          </button>
        </div>
      </PageHeader>

      <div className="p-4 sm:p-6">
        <Link href="/staff" className="mb-4 inline-block text-sm font-semibold text-amber-600 hover:underline">
          ← All staff
        </Link>
        <div
          className={`mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-xl border p-6 sm:flex-row sm:items-start ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-amber-200 bg-yellow-50"
          }`}
        >
          <Avatar src={image} name={fullName} className="h-40 w-40 rounded-xl text-4xl" />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
              {fullName}
              {gender === "male" ? (
                <IoMdMale className="text-blue-500" aria-label="Male" />
              ) : (
                <IoMdFemale className="text-pink-500" aria-label="Female" />
              )}
            </h2>
            <p className="mb-4 font-semibold text-amber-600">{jobType}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className={`text-sm ${muted}`}>Email</dt>
                <dd className="break-words">
                  <a href={`mailto:${email}`} className="hover:underline">
                    {email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={`text-sm ${muted}`}>Phone</dt>
                <dd>{tel}</dd>
              </div>
              <div>
                <dt className={`text-sm ${muted}`}>Birthday</dt>
                <dd>{formatDate(birth)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
