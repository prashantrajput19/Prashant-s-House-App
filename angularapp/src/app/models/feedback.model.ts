export interface Feedback {
  feedbackId?: number;
  feedbackText: string;
  date: string;
  user: { userId: number };
  architect?: { architectId: number };
  category: string;
  rating?: number;
}
