"use client";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { ICard } from "@/Interface/card";
import useDataStore, { writeErrorMessage } from "@/Store/DataStore";
import { daysAgo } from "@/lib/utils";
import { Button } from "@/src/Components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/Components/ui/dialog";
import { Input } from "@/src/Components/ui/input";
import { Field, FormError, FormSelect, PhotoField } from "@/src/Components/admin/FormParts";

/** Radix Select has no empty value, so "No coach" travels as this and is saved as "". */
const NO_COACH = "__none__";

export default function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const staff = useDataStore((s) => s.staff);
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhoto("");
    setError("");
    setBusy(false);
  }, [open]);

  const coaches = [...new Set(staff.filter((s) => s.jobType === "Trainer" || s.jobType === "Instructor").map((s) => `${s.FName} ${s.Lname}`))];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = (name: string) => String(fd.get(name) ?? "").trim();
    const fullName = val("name");
    const email = val("email");
    const height = parseInt(val("height"), 10);
    const weight = parseInt(val("weight"), 10);
    const goals = val("goals");
    if (!fullName || !email || !height || !weight || !goals) return setError("Please fill in name, email, height, weight and goal");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email");

    const membershipType = val("type") as ICard["membershipType"];
    const coach = val("coach");
    const now = new Date().toISOString();
    const card: ICard = {
      id: "C" + Date.now().toString().slice(-6),
      owner: fullName,
      fullName,
      image: photo,
      remainingAccesses: membershipType === "Year" ? 30 : 10,
      status: "active",
      lastUsed: now,
      lastVisit: now,
      gender: val("gender") as ICard["gender"],
      birthDate: "",
      email,
      phone: val("phone"),
      membershipType,
      startDate: daysAgo(0),
      endDate: daysAgo(membershipType === "Year" ? -365 : -30),
      height,
      weight,
      goals,
      coach: coach === NO_COACH ? "" : coach,
      checkInHistory: [],
      notes: "",
      isBlacklisted: false,
      createdAt: now,
      updatedAt: now,
    };
    // Save before closing: on an API error the dialog stays open with the message, nothing changes.
    setBusy(true);
    setError("");
    try {
      await useDataStore.getState().addMember(card);
    } catch (err) {
      setError(writeErrorMessage(err));
      setBusy(false);
      return;
    }
    setBusy(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Add new member</DialogTitle>
            <DialogDescription className="sr-only">Details of the new member</DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4">
            <PhotoField src={photo} label="Add photo (optional)" onPick={setPhoto} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="au-name">
                <Input id="au-name" name="name" autoComplete="off" />
              </Field>
              <Field label="Email" htmlFor="au-email">
                <Input id="au-email" name="email" type="email" />
              </Field>
              <Field label="Phone" htmlFor="au-phone">
                <Input id="au-phone" name="phone" type="tel" />
              </Field>
              <Field label="Gender" htmlFor="au-gender">
                <FormSelect
                  id="au-gender"
                  name="gender"
                  defaultValue="female"
                  options={[
                    ["female", "Female"],
                    ["male", "Male"],
                  ]}
                />
              </Field>
              <Field label="Height (cm)" htmlFor="au-height">
                <Input id="au-height" name="height" type="number" min={100} max={250} />
              </Field>
              <Field label="Weight (kg)" htmlFor="au-weight">
                <Input id="au-weight" name="weight" type="number" min={30} max={250} />
              </Field>
              <Field label="Membership" htmlFor="au-type">
                <FormSelect
                  id="au-type"
                  name="type"
                  defaultValue="Monthly"
                  options={[
                    ["Monthly", "Monthly"],
                    ["Year", "Year"],
                  ]}
                />
              </Field>
              <Field label="Coach" htmlFor="au-coach">
                <FormSelect
                  id="au-coach"
                  name="coach"
                  defaultValue={coaches[0] ?? NO_COACH}
                  options={[...coaches.map((c) => [c, c] as const), [NO_COACH, "No coach"]]}
                />
              </Field>
            </div>
            <Field label="Goal" htmlFor="au-goals">
              <Input id="au-goals" name="goals" placeholder="e.g. Lose weight" />
            </Field>
            <FormError>{error}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy && <Loader2Icon aria-hidden className="animate-spin" />}
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
