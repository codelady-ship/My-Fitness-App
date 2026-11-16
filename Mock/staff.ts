import { IStaff } from "../Interface/staff";

/** Fictional staff. Emails use the reserved .example domain. */
export const staffData: IStaff[] = [
  { id: "1", FName: "Leyla", Lname: "Taghizade", email: "leyla.taghizade@myfitness.example", tel: "+994 50 200 10 01", birth: "1991-03-08", gender: "female", image: "/image.jpg", jobType: "Trainer" },
  { id: "2", FName: "Rauf", Lname: "Gasimov", email: "rauf.gasimov@myfitness.example", tel: "+994 50 200 10 02", birth: "1987-09-21", gender: "male", image: "/download2.jpg", jobType: "Trainer" },
  { id: "3", FName: "Kamran", Lname: "Rahimli", email: "kamran.rahimli@myfitness.example", tel: "+994 50 200 10 03", birth: "1993-12-02", gender: "male", image: "", jobType: "Instructor" },
  { id: "4", FName: "Gunay", Lname: "Abbasova", email: "gunay.abbasova@myfitness.example", tel: "+994 50 200 10 04", birth: "1996-06-14", gender: "female", image: "/download1.jpg", jobType: "Instructor" },
  { id: "5", FName: "Elnur", Lname: "Babayev", email: "elnur.babayev@myfitness.example", tel: "+994 50 200 10 05", birth: "1982-01-30", gender: "male", image: "", jobType: "Manager" },
  { id: "6", FName: "Sabina", Lname: "Huseynova", email: "sabina.huseynova@myfitness.example", tel: "+994 50 200 10 06", birth: "1999-04-11", gender: "female", image: "", jobType: "Receptionist" },
  { id: "7", FName: "Javid", Lname: "Ismayilov", email: "javid.ismayilov@myfitness.example", tel: "+994 50 200 10 07", birth: "1994-08-25", gender: "male", image: "", jobType: "Trainer" },
  { id: "8", FName: "Nargiz", Lname: "Valiyeva", email: "nargiz.valiyeva@myfitness.example", tel: "+994 50 200 10 08", birth: "1990-11-17", gender: "female", image: "", jobType: "Instructor" },
];

export const JOB_TYPES = ["Trainer", "Instructor", "Manager", "Receptionist"] as const;
