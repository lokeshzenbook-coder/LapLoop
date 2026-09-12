export interface User {
  id: number;
  name: string;
  email: string;
  location: string;
  phone: string;
  createdAt: string;
}

export type PublicUser = {
  id: number;
  name: string;
  location: string;
};

export interface LaptopImage {
  id: number;
  laptopId: number;
  url: string;
  position: number;
}

export interface Laptop {
  id: number;
  brand: string;
  model: string;
  cpu: string;
  ramGB: number;
  storageGB: number;
  storageType: string;
  gpu: string;
  display: string;
  condition: string;
  ageYears: number;
  batteryHealth: number;
  price: number;
  location: string;
  description: string;
  status: string;
  views: number;
  isFavorite?: boolean;
  seller?: PublicUser;
  images: LaptopImage[];
  createdAt: string;
  updatedAt: string;
}

export interface LaptopPayload {
  brand: string;
  model: string;
  cpu: string;
  ramGB: number;
  storageGB: number;
  storageType: string;
  gpu: string;
  display: string;
  condition: string;
  ageYears: number;
  batteryHealth: number;
  price: number;
  location: string;
  description: string;
  status: string;
}

export interface PaginatedLaptops {
  items: Laptop[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  brands: string[];
}

export interface Inquiry {
  id: number;
  laptopId: number;
  userId: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---- UI ---------------------------------------------------------------

export interface Filters {
  q: string;
  brand: string;
  condition: string;
  minRam: number;
  minStorage: number;
  minPrice: string;
  maxPrice: string;
  location: string;
  sort: SortKey;
}

export type SortKey =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular";

export const CONDITIONS: Record<string, string> = {
  "like-new": "Like new",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  damaged: "Damaged",
};

export const BRANDS = [
  "Apple",
  "Dell",
  "Lenovo",
  "HP",
  "ASUS",
  "Acer",
  "MSI",
  "Samsung",
  "Huawei",
  "Framework",
  "Razer",
  "Microsoft",
  "Gigabyte",
  "Other",
];

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  sold: "Sold",
  inactive: "Inactive",
};