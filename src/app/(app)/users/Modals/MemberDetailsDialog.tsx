"use client";
import { ICard } from "@/Interface/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/src/Components/ui/button";
import { useLast } from "@/src/Components/admin/useLast";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/Components/ui/dialog";

type Props = {
  /** the member to show; closed while null */
  card: ICard | null;
  onClose: () => void;
  onEdit: (card: ICard) => void;
  onDelete: (card: ICard) => void;
};

/** Everything on a member's card, with Edit / Delete / Close. */
export default function MemberDetailsDialog({ card: current, onClose, onEdit, onDelete }: Props) {
  const card = useLast(current);
  const rows: [string, string][] = card
    ? [
        ["Gender", card.gender === "male" ? "Male" : "Female"],
        ["Birth date", formatDate(card.birthDate) || "Not set"],
        ["Email", card.email],
        ["Phone", card.phone || "Not set"],
        ["Membership", `${card.membershipType} (${formatDate(card.startDate)} to ${formatDate(card.endDate)})`],
        ["Remaining visits", String(card.remainingAccesses)],
        ["Last visit", formatDate(card.lastVisit, true)],
        ["Height / weight", `${card.height} cm / ${card.weight} kg`],
        ["Goal", card.goals],
        ["Coach", card.coach || "None"],
        ["Notes", card.notes || "None"],
        ["Blacklisted", card.isBlacklisted ? "Yes" : "No"],
      ]
    : [];

  return (
    <Dialog open={!!current} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {card && (
          <>
            <DialogHeader>
              <DialogTitle>{card.fullName}</DialogTitle>
              <DialogDescription className="sr-only">Member details</DialogDescription>
            </DialogHeader>
            <DialogBody className="py-2">
              <dl className="divide-y text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium [overflow-wrap:anywhere]">{v}</dd>
                  </div>
                ))}
              </dl>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button type="button" variant="outline" className="text-[#b02a19]" onClick={() => onDelete(card)}>
                Delete
              </Button>
              <Button type="button" onClick={() => onEdit(card)}>
                Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
