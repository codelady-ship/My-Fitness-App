"use client";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { ICard } from "@/Interface/card";
import useDataStore, { writeErrorMessage } from "@/Store/DataStore";
import { Button } from "@/src/Components/ui/button";
import { Checkbox } from "@/src/Components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/Components/ui/dialog";
import { Input } from "@/src/Components/ui/input";
import { Textarea } from "@/src/Components/ui/textarea";
import { Field, FormError, FormSelect, PhotoField } from "@/src/Components/admin/FormParts";
import { useLast } from "@/src/Components/admin/useLast";

/** Edit form for the member in `card`; closed while `card` is null. */
export default function EditMemberDialog({ card: current, onClose }: { card: ICard | null; onClose: () => void }) {
  const card = useLast(current);
  const open = !!current;
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!current) return;
    setPhoto("");
    setError("");
    setBusy(false);
  }, [current]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!card) return;
    const fd = new FormData(e.currentTarget);
    const val = (name: string) => String(fd.get(name) ?? "").trim();
    const fullName = val("fullName");
    if (!fullName || !val("email")) return setError("Name and email are required");

    const updated: ICard = {
      ...card,
      owner: fullName,
      fullName,
      image: photo || card.image,
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
      notes: String(fd.get("notes") ?? ""),
      isBlacklisted: fd.get("isBlacklisted") === "on",
      updatedAt: new Date().toISOString(),
    };
    // Save before closing: on an API error the dialog stays open with the message, nothing changes.
    setBusy(true);
    setError("");
    try {
      await useDataStore.getState().updateMember(updated);
    } catch (err) {
      setError(writeErrorMessage(err));
      setBusy(false);
      return;
    }
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        {card && (
          <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>Edit {card.fullName}</DialogTitle>
              <DialogDescription className="sr-only">Member details</DialogDescription>
            </DialogHeader>
            <DialogBody className="grid gap-4">
              <PhotoField src={photo || card.image} label="Change photo" onPick={setPhoto} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="eu-fullName">
                  <Input id="eu-fullName" name="fullName" defaultValue={card.fullName} />
                </Field>
                <Field label="Email" htmlFor="eu-email">
                  <Input id="eu-email" name="email" type="email" defaultValue={card.email} />
                </Field>
                <Field label="Phone" htmlFor="eu-phone">
                  <Input id="eu-phone" name="phone" type="tel" defaultValue={card.phone} />
                </Field>
                <Field label="Gender" htmlFor="eu-gender">
                  <FormSelect
                    id="eu-gender"
                    name="gender"
                    defaultValue={card.gender}
                    options={[
                      ["female", "Female"],
                      ["male", "Male"],
                    ]}
                  />
                </Field>
                <Field label="Birth date" htmlFor="eu-birthDate">
                  <Input id="eu-birthDate" name="birthDate" type="date" defaultValue={card.birthDate} />
                </Field>
                <Field label="Status" htmlFor="eu-status">
                  <FormSelect
                    id="eu-status"
                    name="status"
                    defaultValue={card.status}
                    options={[
                      ["active", "Active"],
                      ["passive", "Passive"],
                      ["expired", "Expired"],
                    ]}
                  />
                </Field>
                <Field label="Membership" htmlFor="eu-membershipType">
                  <FormSelect
                    id="eu-membershipType"
                    name="membershipType"
                    defaultValue={card.membershipType}
                    options={[
                      ["Monthly", "Monthly"],
                      ["Year", "Year"],
                    ]}
                  />
                </Field>
                <Field label="Remaining visits" htmlFor="eu-remainingAccesses">
                  <Input id="eu-remainingAccesses" name="remainingAccesses" type="number" defaultValue={card.remainingAccesses} />
                </Field>
                <Field label="Start date" htmlFor="eu-startDate">
                  <Input id="eu-startDate" name="startDate" type="date" defaultValue={card.startDate} />
                </Field>
                <Field label="End date" htmlFor="eu-endDate">
                  <Input id="eu-endDate" name="endDate" type="date" defaultValue={card.endDate} />
                </Field>
                <Field label="Height (cm)" htmlFor="eu-height">
                  <Input id="eu-height" name="height" type="number" defaultValue={card.height} />
                </Field>
                <Field label="Weight (kg)" htmlFor="eu-weight">
                  <Input id="eu-weight" name="weight" type="number" defaultValue={card.weight} />
                </Field>
                <Field label="Goal" htmlFor="eu-goals">
                  <Input id="eu-goals" name="goals" defaultValue={card.goals} />
                </Field>
                <Field label="Coach" htmlFor="eu-coach">
                  <Input id="eu-coach" name="coach" defaultValue={card.coach} />
                </Field>
              </div>
              <Field label="Notes" htmlFor="eu-notes">
                <Textarea id="eu-notes" name="notes" rows={3} defaultValue={card.notes} />
              </Field>
              <label htmlFor="eu-isBlacklisted" className="flex min-h-11 w-fit cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <Checkbox id="eu-isBlacklisted" name="isBlacklisted" defaultChecked={card.isBlacklisted} />
                Blacklisted
              </label>
              <FormError>{error}</FormError>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} aria-busy={busy}>
                {busy && <Loader2Icon aria-hidden className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
