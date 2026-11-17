import React from "react";
import { ICard } from "@/Interface/card";
import Avatar from "@/src/Components/Avatar";
import { formatDate } from "@/lib/utils";


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
}: ICard & { darkMode?: boolean }) => {
  const sub = "muted";
  return (
    <li className="glass-solid lift p-5">
      <div className="mb-4 flex items-center gap-4">
        <Avatar src={image} name={owner} className="h-20 w-20 shrink-0 rounded-full border-2 border-white text-xl shadow" />
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
        <span className={`status status-${status}`}>{statusLabel[status]}</span>
        <span className={`text-sm ${remainingAccesses <= 2 ? "text-[#b8321e]" : ""}`}>
          Remaining visits: <strong>{remainingAccesses}</strong>
        </span>
      </div>
    </li>
  );
};

export default CardItem;
