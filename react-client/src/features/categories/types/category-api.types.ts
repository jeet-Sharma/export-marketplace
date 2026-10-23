/** GET /categories response item — see Category entity on the backend. */
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number | null;
}
