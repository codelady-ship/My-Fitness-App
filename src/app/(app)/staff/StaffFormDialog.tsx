"use client";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { IStaff } from "@/Interface/staff";
import { JOB_TYPES } from "@/Mock/staff";
import { writeErrorMessage } from "@/Store/DataStore";
import { Button } from "@/src/Components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/Components/ui/dialog";
import { Input } from "@/src/Components/ui/input";
import { Field, FormError, FormSelect, PhotoField } from "@/src/Components/admin/FormParts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** the member to edit; leave out to add a new one */
  member?: IStaff;
  /** saves the member (API or demo); runs before the dialog closes so errors are shown inside it */
  save: (data: IStaff) => Promise<IStaff>;
  /** called with the saved member after the dialog closed */
  onSaved: (member: IStaff) => void;
};

/** Add / edit form for a staff member. */
export default function StaffFormDialog({ open, onOpenChange, member, save, onSaved }: Props) {
  const m: Partial<IStaff> = member ?? { gender: "female", jobType: "Trainer" };
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhoto("");
    setError("");
    setBusy(false);
  }, [open]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = (name: string) => String(fd.get(name) ?? "").trim();
    const data: IStaff = {
      id: member?.id ?? Date.now().toString(36),
      FName: val("fname"),
      Lname: val("lname"),
      email: val("email"),
      tel: val("tel"),
      birth: val("birth"),
      jobType: val("job"),
      gender: val("gender") as IStaff["gender"],
      image: photo || (member?.image ?? ""),
    };
    if (!data.FName || !data.Lname || !data.email || !data.tel || !data.birth) return setError("Please fill in all fields");
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return setError("Please enter a valid email");

    setBusy(true);
    setError("");
    let saved: IStaff;
    try {
      saved = await save(data);
    } catch (err) {
      setError(writeErrorMessage(err));
      setBusy(false);
      return;
    }
    setBusy(false);
    onOpenChange(false);
    onSaved(saved);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{member ? `Edit ${m.FName} ${m.Lname}` : "Add staff member"}</DialogTitle>
            <DialogDescription className="sr-only">Staff member details</DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4">
            <PhotoField src={photo || m.image || ""} label="Change photo" onPick={setPhoto} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" htmlFor="sf-fname">
                <Input id="sf-fname" name="fname" defaultValue={m.FName} autoComplete="off" />
              </Field>
              <Field label="Last name" htmlFor="sf-lname">
                <Input id="sf-lname" name="lname" defaultValue={m.Lname} autoComplete="off" />
              </Field>
              <Field label="Email" htmlFor="sf-email">
                <Input id="sf-email" name="email" type="email" defaultValue={m.email} />
              </Field>
              <Field label="Phone" htmlFor="sf-tel">
                <Input id="sf-tel" name="tel" type="tel" defaultValue={m.tel} />
              </Field>
              <Field label="Birthday" htmlFor="sf-birth">
                <Input id="sf-birth" name="birth" type="date" defaultValue={m.birth} />
              </Field>
              <Field label="Job" htmlFor="sf-job">
                <FormSelect
                  id="sf-job"
                  name="job"
                  // a job title the list does not have falls back to the first one, as the old <select> did
                  defaultValue={(JOB_TYPES as readonly string[]).includes(m.jobType ?? "") ? (m.jobType as string) : JOB_TYPES[0]}
                  options={JOB_TYPES.map((j) => [j, j] as const)}
                />
              </Field>
              <Field label="Gender" htmlFor="sf-gender">
                <FormSelect
                  id="sf-gender"
                  name="gender"
                  defaultValue={m.gender === "male" ? "male" : "female"}
                  options={[
                    ["female", "Female"],
                    ["male", "Male"],
                  ]}
                />
              </Field>
            </div>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy && <Loader2Icon aria-hidden className="animate-spin" />}
              {member ? "Save changes" : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
