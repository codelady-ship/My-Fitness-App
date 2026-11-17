import { Ilinks } from "../Interface/links";
import { FiActivity, FiUsers, FiCreditCard, FiBriefcase } from "react-icons/fi";

export const links: Ilinks[] = [
  { id: 0, title: "Overview", to: "/dashboard", icon: FiActivity },
  { id: 2, title: "Members", to: "/users", icon: FiUsers },
  { id: 3, title: "Cards", to: "/cards", icon: FiCreditCard },
  { id: 1, title: "Staff", to: "/staff", icon: FiBriefcase },
];
