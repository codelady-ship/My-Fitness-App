export interface IStaff {
  id: string;
  FName: string;
  Lname: string;
  email: string;
  tel: string;
  /** ISO date, YYYY-MM-DD */
  birth: string;
  gender: "male" | "female";
  /** URL or data URL; empty string = show initials */
  image: string;
  jobType: string;
}
