"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { IoMdMale, IoMdFemale } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { MdDeleteOutline } from "react-icons/md";
import useSidebarStore from "@/Store/SidebarStore";
import useDataStore, { writeErrorMessage } from "@/Store/DataStore";
import PageHeader from "@/src/Components/PageHeader";
import Avatar from "@/src/Components/Avatar";
import { formatDate } from "@/lib/utils";
import { showStaffForm, toast } from "../staffModal";

const StaffDetail = () => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const { staff, ready, updateStaff, removeStaff } = useDataStore();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const member = staff.find((s) => s.id === id);

  useEffect(() => {
    if (member) document.title = `${member.FName} ${member.Lname} | Pulsa`;
  }, [member]);

  if (!ready) return <PageHeader title="Staff member" />;

  if (!member) {
    return (
      <div>
        <PageHeader title="Staff member not found" />
        <p className="glass panel">
          This staff member does not exist or was deleted.{" "}
          <Link href="/staff" className="font-semibold text-[var(--coral-ink)] underline">
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
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      // Delete on the server first; only leave the page after it succeeded.
      preConfirm: async () => {
        try {
          await removeStaff(member.id);
          return true;
        } catch (err) {
          Swal.showValidationMessage(writeErrorMessage(err));
          return false;
        }
      },
    });
    if (!r.isConfirmed) return;
    router.push("/staff");
    toast(`${fullName} was deleted`, darkMode);
  };

  const handleEdit = async () => {
    const updated = await showStaffForm(darkMode, member, updateStaff);
    if (!updated) return;
    toast("Changes saved", darkMode);
  };

  const muted = "muted";

  return (
    <div>
      <PageHeader title="Staff member">
        <div className="flex gap-2">
          <button type="button" onClick={handleEdit} className="btn btn-ghost btn-sm">
            <CiEdit className="text-xl" /> Edit
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-ghost btn-sm" style={{ color: "#b8321e" }}>
            <MdDeleteOutline className="text-xl" /> Delete
          </button>
        </div>
      </PageHeader>

      <div>
        <Link href="/staff" className="mb-4 inline-block text-sm font-semibold text-[var(--coral-ink)] hover:underline">
          ← All staff
        </Link>
        <div className="glass-solid mx-auto flex max-w-3xl flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
          <Avatar src={image} name={fullName} className="h-40 w-40 rounded-3xl text-4xl" />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
              {fullName}
              {gender === "male" ? (
                <IoMdMale className="text-blue-500" aria-label="Male" />
              ) : (
                <IoMdFemale className="text-pink-500" aria-label="Female" />
              )}
            </h2>
            <p className="badge badge-coral mb-4">{jobType}</p>
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
