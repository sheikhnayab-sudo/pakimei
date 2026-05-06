export type Status = 'pending' | 'approved' | 'rejected';

export interface StolenPhone {
  id?: string;
  imei: string;
  model: string;
  city: string;
  phone: string;
  imageUrl?: string;
  status: Status;
  createdAt: any; // Firestore Timestamp
  submittedBy?: string;
}

export interface Admin {
  email: string;
  role: 'admin' | 'moderator';
}
