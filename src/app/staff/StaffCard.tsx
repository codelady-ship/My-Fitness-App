import React from "react";
import Link from "next/link";
import { IStaff } from "../../../Interface/staff";
import Avatar from "../../Components/Avatar";

const StaffCard = ({ id, image, FName, Lname, jobType, darkMode }: IStaff & { darkMode: boolean }) => (
  <li>
    <Link
      href={`/staff/${id}`}
      className={`flex h-full flex-col items-center rounded-xl border p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        darkMode ? "border-gray-700 bg-gray-800" : "border-amber-200 bg-yellow-50"
      }`}
    >
      <Avatar src={image} name={`${FName} ${Lname}`} className="h-24 w-24 rounded-full text-2xl" />
      <h2 className="mt-3 text-lg font-semibold">
        {FName} {Lname}
      </h2>
      <p className={darkMode ? "text-gray-400" : "text-amber-800"}>{jobType}</p>
    </Link>
  </li>
);

export default StaffCard;
