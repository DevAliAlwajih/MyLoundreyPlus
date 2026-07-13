import { create } from 'zustand';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  notes: string;
  createdAt: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
}

interface BookingStore {
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
