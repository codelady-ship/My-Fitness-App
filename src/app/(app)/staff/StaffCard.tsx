import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { IStaff } from "@/Interface/staff";
import Avatar from "@/src/Components/Avatar";
import { Badge } from "@/src/Components/ui/badge";

const StaffCard = ({ id, image, FName, Lname, jobType }: IStaff) => (
  <li>
    <Link
      href={`/staff/${id}`}
      className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-4 text-foreground no-underline shadow-[0_1px_2px_rgba(22,33,58,0.05)] transition-colors hover:border-input hover:bg-[#f9fafb]"
    >
      <Avatar src={image} name={`${FName} ${Lname}`} className="size-16 rounded-2xl text-lg" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base leading-snug font-semibold">
          {FName} {Lname}
        </h2>
        <Badge variant="coral" className="mt-1.5">
          {jobType}
        </Badge>
      </div>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  </li>
);

export default StaffCard;
