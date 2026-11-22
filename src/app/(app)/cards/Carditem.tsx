import React from "react";
import { ICard } from "@/Interface/card";
import Avatar from "@/src/Components/Avatar";
import StatusBadge from "@/src/Components/admin/StatusBadge";
import { Card } from "@/src/Components/ui/card";
import { formatDate } from "@/lib/utils";

const statusLabel: Record<ICard["status"], string> = { active: "Active", expired: "Expired", passive: "Passive" };

const CardItem = ({ owner, image, id, remainingAccesses, status, lastVisit, membershipType, endDate }: ICard) => (
  <li>
    <Card className="h-full gap-0 py-0">
      <div className="flex items-center gap-3.5 p-5">
        <Avatar src={image} name={owner} className="size-14 rounded-full text-base" />
        <div className="min-w-0">
          <h2 className="truncate text-base leading-snug font-semibold">{owner}</h2>
          <p className="text-[13px] text-muted-foreground tabular-nums">Card ID: {id}</p>
        </div>
      </div>
      <div className="grid gap-1 px-5 pb-4 text-sm text-muted-foreground">
        <p>
          {membershipType === "Year" ? "Yearly" : "Monthly"}, until {formatDate(endDate)}
        </p>
        <p>Last visit: {formatDate(lastVisit)}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3.5">
        <StatusBadge tone={status}>{statusLabel[status]}</StatusBadge>
        <span className={`text-sm ${remainingAccesses <= 2 ? "text-[#b02a19]" : ""}`}>
          Remaining visits: <strong className="tabular-nums">{remainingAccesses}</strong>
        </span>
      </div>
    </Card>
  </li>
);

export default CardItem;
