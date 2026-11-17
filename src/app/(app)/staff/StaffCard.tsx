import React from "react";
import Link from "next/link";
import { IStaff } from "@/Interface/staff";
import Avatar from "@/src/Components/Avatar";

const StaffCard = ({ id, image, FName, Lname, jobType }: IStaff & { darkMode?: boolean }) => (
  <li>
    <Link
      href={`/staff/${id}`}
      className="glass-solid lift flex h-full flex-col items-center p-5 text-center text-[var(--ink)] no-underline"
    >
      <Avatar src={image} name={`${FName} ${Lname}`} className="h-24 w-24 rounded-full text-2xl" />
      <h2 className="mt-3 text-lg font-semibold">
        {FName} {Lname}
      </h2>
      <p className="badge badge-coral mt-2">{jobType}</p>
    </Link>
  </li>
);

export default StaffCard;
