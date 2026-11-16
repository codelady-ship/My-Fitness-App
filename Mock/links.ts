import { Ilinks } from "../Interface/links";
import { IoPeopleCircleOutline } from "react-icons/io5";
import { FaUserCircle, FaAddressCard, FaChartLine } from "react-icons/fa";

export const links: Ilinks[] = [
  { id: 0, title: "Dashboard", to: "/dashboard", icon: FaChartLine },
  { id: 1, title: "Staff", to: "/staff", icon: IoPeopleCircleOutline },
  { id: 2, title: "Members", to: "/users", icon: FaUserCircle },
  { id: 3, title: "Cards", to: "/cards", icon: FaAddressCard },
];
