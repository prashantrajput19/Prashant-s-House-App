export interface Architect {
  architectId?: number;
  name: string;
  expertise: string;
  location: string;
  rating: number;
  portfolioLink: string;
  status: string;
}

export interface TopArchitect {
  architect: Architect;
  score: number;
  userAverage: number | null;
  reviews: number;
}
