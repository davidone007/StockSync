import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Local storage helpers with JSON handling and namespacing
const STORAGE_PREFIX = "stocksync:";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse<T>(localStorage.getItem(STORAGE_PREFIX + key), fallback);
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

// Barcode dataset persistence
export type BarcodeDatasetEntry = {
  name: string;
  price?: number;
  image?: string;
};
export type BarcodeDataset = Record<string, BarcodeDatasetEntry>;

export function loadBarcodeDataset(): BarcodeDataset {
  return loadFromStorage<BarcodeDataset>("barcodeDb", {});
}

export function saveBarcodeDataset(dataset: BarcodeDataset): void {
  saveToStorage("barcodeDb", dataset);
}

// Domain models
export type UserRole = "tendero" | "proveedor" | "admin";
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string; // prototype only
  role: UserRole;
  storeName?: string; // para tenderos
  phone?: string;
  address?: string; // para proveedores
  description?: string; // para proveedores
  businessName?: string; // nombre del negocio/empresa para proveedores
}

export interface ProductRecord {
  id: number;
  name: string;
  barcode: string;
  stock: number;
  minStock: number;
  price: number;
  image?: string;
  description?: string;
  discount?: number;
  category?: string;
  ownerUserId?: string; // to associate with user
  catalogType?: "tendero" | "proveedor"; // inventory vs supplier catalog
}

export interface AnnouncementRecord {
  id: number;
  productIds: number[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  messages: ChatMessage[];
  lastMessageAt: string;
}

export interface AppState {
  users: UserRecord[];
  currentUserId: string | null;
  products: ProductRecord[];
  supplierProducts: ProductRecord[];
  announcements: AnnouncementRecord[];
  chats: ChatConversation[];
}

export function initializeStateIfNeeded(): AppState {
  const existing = loadFromStorage<AppState>("state", {
    users: [],
    currentUserId: null,
    products: [],
    supplierProducts: [],
    announcements: [],
    chats: [],
  });

  if (existing.users.length === 0) {
    const admin: UserRecord = {
      id: crypto.randomUUID(),
      name: "Admin",
      email: "admin@stocksync.local",
      password: "admin", // prototype default
      role: "admin",
    };
    const state: AppState = {
      ...existing,
      users: [admin],
      currentUserId: null,
      chats: [],
    };
    saveToStorage("state", state);
    return state;
  }

  // Asegurar que chats existe (para estados antiguos)
  if (!existing.chats) {
    existing.chats = [];
    saveToStorage("state", existing);
  }

  return existing;
}

export function updateState(mutator: (state: AppState) => AppState): AppState {
  const state = initializeStateIfNeeded();
  const next = mutator(state);
  saveToStorage("state", next);
  return next;
}

export function getState(): AppState {
  return initializeStateIfNeeded();
}
