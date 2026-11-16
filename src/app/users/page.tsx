"use client";
import React, { useState } from "react";
import useSidebarStore from "../../../Store/SidebarStore";
import useDataStore from "../../../Store/DataStore";
import { showAddUserModal } from "./Modals/addUserModal";
import { showUserCardModal } from "./Modals/userCardClick";
import { ICard } from "../../../Interface/card";
import PageHeader from "../../Components/PageHeader";
import Avatar from "../../Components/Avatar";
import { formatDate } from "../../../lib/utils";

const STATUS_STYLE: Record<ICard["status"], string> = {
  active: "border-l-green-500",
  passive: "border-l-amber-500",
  expired: "border-l-red-500",
};

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

  const field = `rounded-lg border px-3 py-2 ${darkMode ? "border-gray-600 bg-gray-800" : "border-amber-300 bg-white"}`;
  const muted = darkMode ? "text-gray-400" : "text-gray-600";

  return (
    <div>
      <PageHeader title="Members">
        <label className="sr-only" htmlFor="search">
          Search members
        </label>
        <input
          type="search"
          id="search"
          className={`${field} w-full sm:w-64`}
          placeholder="Search name, email, coach…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="sr-only" htmlFor="status">
          Filter by status
        </label>
        <select id="status" className={field} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => showAddUserModal(darkMode)}
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-600"
        >
          + Add member
        </button>
      </PageHeader>

      {ready && filteredCards.length === 0 ? (
        <p className="p-6">{cards.length ? "No members match your search." : "No members yet."}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredCards.map((card) => (
            <li
              key={card.id}
              className={`flex gap-4 rounded-xl border border-l-4 p-4 shadow-sm ${STATUS_STYLE[card.status]} ${
                darkMode ? "border-gray-700 bg-gray-800" : "border-amber-100 bg-yellow-50"
              }`}
            >
              <Avatar src={card.image} name={card.owner} className="h-24 w-24 shrink-0 rounded-lg text-2xl sm:h-32 sm:w-32" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold text-amber-600">{card.owner}</h2>
                <p className="capitalize">
                  <span className={muted}>Status:</span> {card.status}
                  {card.isBlacklisted && <span className="ml-2 rounded bg-red-600 px-1.5 text-xs text-white">blacklisted</span>}
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
                <button
                  type="button"
                  onClick={() => showUserCardModal(card, darkMode)}
                  className="mt-2 rounded-lg border border-amber-500 px-3 py-1 text-sm font-semibold hover:bg-amber-500 hover:text-white"
                >
                  Details
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
