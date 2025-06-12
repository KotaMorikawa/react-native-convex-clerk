export interface SavedLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  domain?: string;
  siteName?: string;
  readingTime?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isRead?: boolean;
  originalApp?: string;
  sharedFrom?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface SearchFilters {
  query: string;
  tags: string[];
  isRead?: boolean;
  sortBy: "newest" | "oldest" | "title" | "readingTime";
}
