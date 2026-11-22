"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IoMdMale, IoMdFemale } from "react-icons/io";
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";
import useDataStore from "@/Store/DataStore";
import PageHeader from "@/src/Components/PageHeader";
import Avatar from "@/src/Components/Avatar";
import ConfirmDialog from "@/src/Components/admin/ConfirmDialog";
import { notifySuccess } from "@/src/Components/admin/notify";
import { Badge } from "@/src/Components/ui/badge";
import { Button } from "@/src/Components/ui/button";
import { Card } from "@/src/Components/ui/card";
import { formatDate } from "@/lib/utils";
import StaffFormDialog from "../StaffFormDialog";

const StaffDetail = () => {
  const { staff, ready, updateStaff, removeStaff } = useDataStore();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const member = staff.find((s) => s.id === id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (member) document.title = `${member.FName} ${member.Lname} | Pulsa`;
  }, [member]);

  if (!ready) return <PageHeader title="Staff member" />;

  if (!member) {
    return (
      <div>
        <PageHeader title="Staff member not found" />
        <Card className="items-start px-6 py-8">
          <p>This staff member does not exist or was deleted.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/staff" className="no-underline">
              Back to staff
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { image, FName, Lname, email, tel, jobType, birth, gender } = member;
  const fullName = `${FName} ${Lname}`;

  return (
    <div>
      <PageHeader title="Staff member">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          <PencilIcon aria-hidden /> Edit
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-[#b02a19]" onClick={() => setDeleting(true)}>
          <Trash2Icon aria-hidden /> Delete
        </Button>
      </PageHeader>

      <Link
        href="/staff"
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-coral-ink no-underline hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="size-4" /> All staff
      </Link>
      <Card className="max-w-3xl flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
        <Avatar src={image} name={fullName} className="size-32 rounded-3xl text-4xl sm:size-36" />
        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-2 font-heading text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
            {fullName}
            {gender === "male" ? (
              <IoMdMale className="size-5 text-[#3b63c4]" aria-label="Male" />
            ) : (
              <IoMdFemale className="size-5 text-[#c43b7a]" aria-label="Female" />
            )}
          </h2>
          <Badge variant="coral" className="mt-2">
            {jobType}
          </Badge>
          <dl className="mt-5 grid gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="mt-0.5 font-medium break-words">
                <a href={`mailto:${email}`} className="-my-3 inline-flex min-h-11 items-center text-foreground no-underline hover:underline">
                  {email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="mt-0.5 font-medium">{tel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Birthday</dt>
              <dd className="mt-0.5 font-medium">{formatDate(birth)}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <StaffFormDialog open={editing} onOpenChange={setEditing} member={member} save={updateStaff} onSaved={() => notifySuccess("Changes saved")} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this staff member?"
        description={`${fullName} will be removed from the list.`}
        confirmLabel="Yes, delete"
        cancelLabel="Keep"
        destructive
        // Delete on the server first; only leave the page after it succeeded.
        onConfirm={() => removeStaff(member.id)}
        onDone={() => {
          router.push("/staff");
          notifySuccess(`${fullName} was deleted`);
        }}
      />
    </div>
  );
};

export default StaffDetail;
