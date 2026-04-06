export const CATEGORIES = [
  'Japanese Cars',
  'European Cars',
  'American Cars',
  'Trucks & Commercial',
  'Motorcycles',
  'Electronics & Electrical',
  'Tyres & Rims',
  'Body Parts',
  'Engine & Transmission',
  'Tools & Equipment',
  'General Hardware',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];
