export type Availability = 'maru' | 'sankaku' | 'batsu';

export interface Candidate {
  id: string;
  date: string;       // "2026-04-15"
  startTime: string | null; // "14:00"
  endTime: string | null;   // "15:00"
}

export interface Response {
  id: string;
  name: string;
  answers: Record<string, Availability>; // candidateId -> availability
  updatedAt: number;
}

export interface ChouEvent {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  candidates: Candidate[];
  responses: Response[];
  finalizedCandidateId: string | null;
  status: 'open' | 'finalized';
  createdAt: number;
  updatedAt: number;
}
