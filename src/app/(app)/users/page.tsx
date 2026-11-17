"use client";
import React, { useState } from "react";
import useSidebarStore from "@/Store/SidebarStore";
import useDataStore from "@/Store/DataStore";
import { showAddUserModal } from "./Modals/addUserModal";
import { showUserCardModal } from "./Modals/userCardClick";
import PageHeader from "@/src/Components/PageHeader";
import Avatar from "@/src/Components/Avatar";
import { formatDate } from "@/lib/utils";

const STATUSES = ["all", "active", "passive", "expired"] as const;

const Users = () => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  const { cards, ready } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const q = searchTerm.trim().toLowerCase();
  const filteredCards = cards.filter(
    (card) =>
      (status === "all" || card.status === status) &&
      [card.owner, card.email, card.phone, card.goals, card.coach].some((v) => (v ?? "").toLowerCase().includes(q)),
  );

  const muted = "muted";

  return (
    <div>
      <PageHeader title="Members" />
      <div className="toolbar">
        <label className="sr-only" htmlFor="search">
          Search members
        </label>
        <input
          type="search"
          id="search"
          className="input"
          placeholder="Search name, email, coach…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="sr-only" htmlFor="status">
          Filter by status
        </label>
        <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => showAddUserModal(darkMode)} className="btn btn-coral">
          + Add member
        </button>
      </div>

      {ready && filteredCards.length === 0 ? (
        <p className="glass panel">{cards.length ? "No members match your search." : "No members yet."}</p>
      ) : (
        <ul className="list-cards">
          {filteredCards.map((card) => (
            <li key={card.id} className="glass-solid lift flex gap-4 p-4">
              <Avatar src={card.image} name={card.owner} className="h-24 w-24 shrink-0 rounded-2xl text-2xl sm:h-28 sm:w-28" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold">{card.owner}</h2>
                <p className="my-1">
                  <span className={`status status-${card.status}`}>{card.status}</span>
                  {card.isBlacklisted && <span className="status status-expired ml-2">blacklisted</span>}
                </p>
                <p>
                  <span className={muted}>Last visit:</span> {formatDate(card.lastVisit, true)}
                </p>
                <p className="truncate">
                  <span className={muted}>Goal:</span> {card.goals}
                </p>
                <p className="truncate">
                  <span className={muted}>Coach:</span> {card.coach || "None"}
                </p>
                <button type="button" onClick={() => showUserCardModal(card, darkMode)} className="btn btn-ink btn-sm mt-2">
                  Details<span className="sr-only"> for {card.owner}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Users;
