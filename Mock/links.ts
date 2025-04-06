import { Ilinks } from "../Interface/links";
import { IoPeopleCircleOutline } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import { FaAddressCard } from "react-icons/fa";
import { FaChartLine } from "react-icons/fa";
export const links: Ilinks[]=[
    {id:0, title:"Dashbroad", to:"/dashbroad",icon:FaChartLine },
    {id:1, title:"Staff", to:"/staff",icon:IoPeopleCircleOutline },
    {id:2, title:"Users", to:"/users",icon:FaUserCircle },
    {id:3, title:"Cards", to:"/cards",icon:FaAddressCard },
  ]