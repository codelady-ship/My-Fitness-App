import React from "react";
import { ICard } from "../../../Interface/card";
import Avatar from "../../Components/Avatar";
import { formatDate } from "../../../lib/utils";

const statusColors: Record<ICard["status"], string> = {
  active: "bg-green-200 text-green-800",
  expired: "bg-red-200 text-red-800",
  passive: "bg-gray-200 text-gray-800",
};

const statusLabel: Record<ICard["status"], string> = { active: "Active", expired: "Expired", passive: "Passive" };

const CardItem = ({
  owner,
  image,
  id,
  remainingAccesses,
  status,
  lastVisit,
  membershipType,
  endDate,
  darkMode,
}: ICard & { darkMode: boolean }) => {
  const sub = darkMode ? "text-gray-300" : "text-amber-800";
  return (
    <li className={`rounded-xl p-5 shadow-sm ${darkMode ? "bg-gray-800" : "border border-amber-100 bg-yellow-50"}`}>
      <div className="mb-4 flex items-center gap-4">
        <Avatar src={image} name={owner} className="h-20 w-20 shrink-0 rounded-full border-2 border-amber-500 text-xl" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{owner}</h2>
          <p className={`text-sm ${sub}`}>Card ID: {id}</p>
          <p className={`text-sm ${sub}`}>
            {membershipType === "Year" ? "Yearly" : "Monthly"}, until {formatDate(endDate)}
          </p>
          <p className={`text-sm ${sub}`}>Last visit: {formatDate(lastVisit)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[status]}`}>{statusLabel[status]}</span>
        <span className={`text-sm ${remainingAccesses <= 2 ? "text-red-500" : ""}`}>
          Remaining visits: <strong>{remainingAccesses}</strong>
        </span>
      </div>
    </li>
  );
};

export default CardItem;
