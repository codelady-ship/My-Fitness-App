import { ICard } from "../Interface/card";
import { dateTimeAgo, daysAgo } from "../lib/utils";

/**
 * Fictional gym members. All dates are relative to "now", so the dashboard
 * ("New registrations", "last visit", expired cards) always looks current.
 * Emails use the reserved .example domain.
 */
type Seed = {
  id: string;
  name: string;
  image: string;
  gender: ICard["gender"];
  birthDate: string;
  phone: string;
  membershipType: ICard["membershipType"];
  /** days since the membership started */
  started: number;
  /** days since the member registered */
  registered: number;
  /** days since the last visit */
  lastVisit: number;
  remainingAccesses: number;
  status: ICard["status"];
  height: number;
  weight: number;
  goals: string;
  coach: string;
  notes: string;
  isBlacklisted?: boolean;
};

const seeds: Seed[] = [
  { id: "C123456", name: "Elvin Mammadov", image: "/download2.jpg", gender: "male", birthDate: "1990-05-12", phone: "+994 50 123 45 67", membershipType: "Year", started: 120, registered: 130, lastVisit: 1, remainingAccesses: 5, status: "active", height: 180, weight: 78, goals: "Increase muscle mass", coach: "Rauf Gasimov", notes: "Good progress on bench press." },
  { id: "C654321", name: "Aysel Aliyeva", image: "/download1.jpg", gender: "female", birthDate: "1995-02-15", phone: "+994 70 123 45 67", membershipType: "Monthly", started: 45, registered: 75, lastVisit: 16, remainingAccesses: 0, status: "expired", height: 165, weight: 60, goals: "Lose weight", coach: "Leyla Taghizade", notes: "Asked about renewing next month." },
  { id: "C654322", name: "Tural Hasanov", image: "", gender: "male", birthDate: "1988-07-20", phone: "+994 70 123 45 68", membershipType: "Year", started: 200, registered: 210, lastVisit: 9, remainingAccesses: 1, status: "passive", height: 177, weight: 82, goals: "Increase physical strength", coach: "Rauf Gasimov", notes: "Paused because of travel." },
  { id: "C654323", name: "Sevinj Karimova", image: "/image.jpg", gender: "female", birthDate: "1993-08-10", phone: "+994 70 123 45 69", membershipType: "Monthly", started: 70, registered: 100, lastVisit: 38, remainingAccesses: 0, status: "expired", height: 168, weight: 65, goals: "More cardio", coach: "Kamran Rahimli", notes: "Did not renew yet." },
  { id: "C654324", name: "Orkhan Mammadli", image: "", gender: "male", birthDate: "1985-11-23", phone: "+994 70 123 45 70", membershipType: "Monthly", started: 12, registered: 12, lastVisit: 0, remainingAccesses: 3, status: "active", height: 180, weight: 85, goals: "Improve body composition", coach: "Leyla Taghizade", notes: "New member, first program set." },
  { id: "C654325", name: "Nigar Javadova", image: "/download1.jpg", gender: "female", birthDate: "1998-03-14", phone: "+994 70 123 45 71", membershipType: "Monthly", started: 20, registered: 20, lastVisit: 2, remainingAccesses: 2, status: "active", height: 162, weight: 58, goals: "More cardio", coach: "Kamran Rahimli", notes: "Prefers morning classes." },
  { id: "C654326", name: "Anar Suleymanov", image: "", gender: "male", birthDate: "1992-04-18", phone: "+994 70 123 45 72", membershipType: "Monthly", started: 95, registered: 160, lastVisit: 64, remainingAccesses: 0, status: "expired", height: 175, weight: 79, goals: "Improve body composition", coach: "Leyla Taghizade", notes: "Blacklisted after repeated unpaid visits.", isBlacklisted: true },
  { id: "C654327", name: "Zahra Guliyeva", image: "/image.jpg", gender: "female", birthDate: "1993-05-16", phone: "+994 70 123 45 73", membershipType: "Monthly", started: 25, registered: 90, lastVisit: 6, remainingAccesses: 4, status: "passive", height: 170, weight: 64, goals: "Increase physical strength", coach: "Rauf Gasimov", notes: "Recovering from a knee injury." },
  { id: "C654328", name: "Farid Aliyev", image: "/download2.jpg", gender: "male", birthDate: "1989-10-22", phone: "+994 70 123 45 74", membershipType: "Year", started: 150, registered: 340, lastVisit: 1, remainingAccesses: 5, status: "active", height: 182, weight: 90, goals: "Increase muscle mass", coach: "Rauf Gasimov", notes: "Second year with us." },
  { id: "C789012", name: "Murad Guliyev", image: "", gender: "male", birthDate: "1994-11-11", phone: "+994 70 123 45 75", membershipType: "Monthly", started: 5, registered: 5, lastVisit: 0, remainingAccesses: 2, status: "active", height: 174, weight: 79, goals: "Increase physical strength", coach: "Kamran Rahimli", notes: "Joined this week." },
];

const emailOf = (name: string) => name.toLowerCase().replace(/\s+/g, ".") + "@mail.example";

export const makeSeedCards = (now = new Date()): ICard[] =>
  seeds.map((s) => {
    const months = s.membershipType === "Year" ? 365 : 30;
    const lastVisit = dateTimeAgo(s.lastVisit, 8, now);
    return {
      id: s.id,
      owner: s.name,
      fullName: s.name,
      image: s.image,
      remainingAccesses: s.remainingAccesses,
      status: s.status,
      lastUsed: lastVisit,
      lastVisit,
      gender: s.gender,
      birthDate: s.birthDate,
      email: emailOf(s.name),
      phone: s.phone,
      membershipType: s.membershipType,
      startDate: daysAgo(s.started, now),
      endDate: daysAgo(s.started - months, now),
      height: s.height,
      weight: s.weight,
      goals: s.goals,
      coach: s.coach,
      checkInHistory: [s.lastVisit + 14, s.lastVisit + 7, s.lastVisit].map((d) => daysAgo(d, now)),
      notes: s.notes,
      isBlacklisted: !!s.isBlacklisted,
      createdAt: daysAgo(s.registered, now),
      updatedAt: daysAgo(s.lastVisit, now),
    };
  });
