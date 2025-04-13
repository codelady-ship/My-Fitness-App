
export interface ICard{
id: string;
owner: string;
image: string;
remainingAccesses: number;
status: 'active' | 'expired' | 'passive'; 
lastUsed: string;
fullName: string;
gender: 'male' | 'female';
birthDate: string;
email: string;
phone: string;
membershipType: 'Year' | 'Monthly'; 
startDate: string;
endDate: string;
lastVisit: string;
height: number; 
weight: number; 
goals: string;
coach: string;
checkInHistory: string[]; 
notes: string;
isBlacklisted: boolean;
createdAt: string;
updatedAt: string; 
}
  