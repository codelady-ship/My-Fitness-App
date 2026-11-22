"use client";
import React, { useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import useDataStore from "@/Store/DataStore";
import { ICard } from "@/Interface/card";
import AddMemberDialog from "./Modals/AddMemberDialog";
import EditMemberDialog from "./Modals/EditMemberDialog";
import MemberDetailsDialog from "./Modals/MemberDetailsDialog";
import PageHeader from "@/src/Components/PageHeader";
import Avatar from "@/src/Components/Avatar";
import ConfirmDialog from "@/src/Components/admin/ConfirmDialog";
import StatusBadge from "@/src/Components/admin/StatusBadge";
import { notifySuccess } from "@/src/Components/admin/notify";
import { Button } from "@/src/Components/ui/button";
import { Card } from "@/src/Components/ui/card";
import { Input } from "@/src/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/Components/ui/select";
import { Skeleton } from "@/src/Components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/Components/ui/table";
import { formatDate } from "@/lib/utils";

const STATUSES = ["all", "active", "passive", "expired"] as const;

const Users = () => {
  const { cards, ready } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [adding, setAdding] = useState(false);
  const [details, setDetails] = useState<ICard | null>(null);
  const [editing, setEditing] = useState<ICard | null>(null);
  const [deleting, setDeleting] = useState<ICard | null>(null);

  const q = searchTerm.trim().toLowerCase();
  const filteredCards = cards.filter(
    (card) =>
      (status === "all" || card.status === status) &&
      [card.owner, card.email, card.phone, card.goals, card.coach].some((v) => (v ?? "").toLowerCase().includes(q)),
  );

  // secondary lines under the name: wrap on a phone (nothing is cut off), one line each from 640px
  const sub = "text-[13px] leading-snug text-muted-foreground [overflow-wrap:anywhere] sm:truncate";
  const statusPills = (card: ICard) => (
    <>
      <StatusBadge tone={card.status}>{card.status}</StatusBadge>
      {card.isBlacklisted && <StatusBadge tone="expired">blacklisted</StatusBadge>}
    </>
  );

  return (
    <div>
      <PageHeader title="Members" />
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-[1_1_220px] sm:max-w-sm">
          <label className="sr-only" htmlFor="search">
            Search members
          </label>
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            id="search"
            className="pl-10"
            placeholder="Search name, email, coach…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="status">
          Filter by status
        </label>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger id="status" className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" onClick={() => setAdding(true)} className="sm:ml-auto">
          <PlusIcon aria-hidden /> Add member
        </Button>
      </div>

      {ready && filteredCards.length === 0 ? (
        <Card className="items-center px-6 py-12 text-center text-muted-foreground">
          {cards.length ? "No members match your search." : "No members yet."}
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden w-32 sm:table-cell">Status</TableHead>
                <TableHead className="hidden w-44 md:table-cell">Last visit</TableHead>
                <TableHead className="hidden min-[1360px]:table-cell">Goal</TableHead>
                <TableHead className="hidden w-44 xl:table-cell">Coach</TableHead>
                <TableHead className="w-[6.5rem] sm:w-28">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-busy={!ready}>
              {!ready &&
                [0, 1, 2, 3, 4].map((i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10" />
                    </TableCell>
                  </TableRow>
                ))}
              {filteredCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-start gap-3 sm:items-center">
                      <Avatar src={card.image} name={card.owner} className="size-10 rounded-full text-sm" />
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold [overflow-wrap:anywhere] sm:truncate">{card.owner}</h2>
                        {/* the columns that do not fit a narrow screen move under the name */}
                        <div className="my-1 flex flex-wrap gap-1 sm:hidden">{statusPills(card)}</div>
                        <p className={sub + " md:hidden"}>Last visit: {formatDate(card.lastVisit, true)}</p>
                        <p className={sub + " min-[1360px]:hidden"}>Goal: {card.goals}</p>
                        <p className={sub + " xl:hidden"}>Coach: {card.coach || "None"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col items-start gap-1">{statusPills(card)}</div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">{formatDate(card.lastVisit, true)}</TableCell>
                  <TableCell className="hidden truncate min-[1360px]:table-cell">{card.goals}</TableCell>
                  <TableCell className="hidden truncate xl:table-cell">{card.coach || "None"}</TableCell>
                  <TableCell className="pl-0 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDetails(card)}>
                      Details<span className="sr-only"> for {card.owner}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AddMemberDialog open={adding} onOpenChange={setAdding} />
      <MemberDetailsDialog
        card={details}
        onClose={() => setDetails(null)}
        onEdit={(card) => {
          setDetails(null);
          setEditing(card);
        }}
        onDelete={(card) => {
          setDetails(null);
          setDeleting(card);
        }}
      />
      <EditMemberDialog card={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this member?"
        description="The member and their card will be removed."
        confirmLabel="Yes, delete"
        destructive
        // Delete on the server first; the member only disappears from the list after it succeeds.
        onConfirm={() => useDataStore.getState().removeMember(deleting!.id)}
        onDone={() => notifySuccess("Deleted", 1400)}
      />
    </div>
  );
};

export default Users;
