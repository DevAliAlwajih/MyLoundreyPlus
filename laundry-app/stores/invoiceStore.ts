import { create } from 'zustand';
import { CatalogItem } from '../hooks/useInvoices';

export type PaymentType = 'cash' | 'card' | 'deferred' | 'electronic';

export interface CartItem {
  itemId: string;
  categoryId: string;
  categoryName: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  serviceType: 'washing_and_ironing' | 'washing_only' | 'ironing_only';
  processingType: 'normal' | 'urgent';
  unitPrice: number;
  washingPrice: number;
  ironingPrice: number;
  fullServicePrice: number;
  totalPrice: number;
  expectedDeliveryAt?: string;
  notes: string;
}

interface InvoiceStore {
  // Cart State
  cart: CartItem[];
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  paymentType: PaymentType;
  isUrgent: boolean;
  discountPercent: number;
  notes: string;
  expectedDeliveryAt?: string;

  // Computed totals
  subtotal: number;
  discountAmount: number;
  urgencyFeeAmount: number;
  taxAmount: number;
  total: number;

  // Constants
  taxPercent: number;
  urgencyPercent: number;

  // Actions
  addItem: (item: CatalogItem, categoryId: string, categoryName: string, serviceType?: 'washing_and_ironing' | 'washing_only' | 'ironing_only') => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  updateItemPrice: (itemId: string, price: number) => void;
  updateServiceType: (itemId: string, type: 'washing_and_ironing' | 'washing_only' | 'ironing_only') => void;
  updateProcessingType: (itemId: string, type: 'normal' | 'urgent') => void;
  updateExpectedDelivery: (itemId: string, date: string) => void;
  
  setCustomer: (name: string, phone: string, location?: string, id?: string) => void;
  clearCustomer: () => void;
  setPaymentType: (type: PaymentType) => void;
  setUrgent: (isUrgent: boolean) => void;
  setDiscount: (percent: number) => void;
  setNotes: (notes: string) => void;
  setExpectedDeliveryAt: (date?: string) => void;
  setTaxPercent: (percent: number) => void;
  clearCart: () => void;
  computeTotals: () => void;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  cart: [],
  customerId: undefined,
  customerName: '',
  customerPhone: '',
  customerLocation: '',
  paymentType: 'cash',
  isUrgent: false,
  discountPercent: 0,
  notes: '',
  expectedDeliveryAt: undefined,

  subtotal: 0,
  discountAmount: 0,
  urgencyFeeAmount: 0,
  taxAmount: 0,
  total: 0,

  taxPercent: 15,
  urgencyPercent: 25, // 25% extra for urgent

  computeTotals: () => {
    const state = get();
    const subtotal = state.cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = subtotal * (state.discountPercent / 100);
    
    // Urgency fee: if global isUrgent, apply to all. Otherwise, apply only to urgent items.
    let urgencyFeeAmount = 0;
    if (state.isUrgent) {
      urgencyFeeAmount = subtotal * (state.urgencyPercent / 100);
    } else {
      const urgentSubtotal = state.cart.filter(c => c.processingType === 'urgent').reduce((sum, item) => sum + item.totalPrice, 0);
      urgencyFeeAmount = urgentSubtotal * (state.urgencyPercent / 100);
    }

    const taxableAmount = subtotal - discountAmount + urgencyFeeAmount;
    const taxAmount = taxableAmount * (state.taxPercent / 100);
    const total = taxableAmount + taxAmount;

    set({
      subtotal,
      discountAmount,
      urgencyFeeAmount,
      taxAmount,
      total,
    });
  },

  addItem: (item, categoryId, categoryName, serviceType = 'washing_and_ironing') => {
    const state = get();
    const existingItem = state.cart.find((c) => c.itemId === item.itemId);
    
    if (existingItem) {
      state.updateQuantity(item.itemId, existingItem.quantity + 1);
    } else {
      let unitPrice = item.fullServicePrice;
      if (serviceType === 'washing_only' && item.washingPrice !== null) unitPrice = item.washingPrice;
      if (serviceType === 'ironing_only' && item.ironingPrice !== null) unitPrice = item.ironingPrice;

      const newItem: CartItem = {
        itemId: item.itemId,
        categoryId,
        categoryName,
        nameAr: item.nameAr,
        nameEn: item.nameEn || item.nameAr,
        quantity: 1,
        unitPrice,
        fullServicePrice: item.fullServicePrice,
        washingPrice: item.washingPrice ?? 0,
        ironingPrice: item.ironingPrice ?? 0,
        totalPrice: unitPrice,
        serviceType,
        processingType: 'normal',
        notes: '',
      };
      set({ cart: [...state.cart, newItem] });
      get().computeTotals();
    }
  },

  removeItem: (itemId) => {
    set((state) => ({ cart: state.cart.filter((c) => c.itemId !== itemId) }));
    get().computeTotals();
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    set((state) => ({
      cart: state.cart.map((c) => {
        if (c.itemId === itemId) {
          return {
            ...c,
            quantity,
            totalPrice: quantity * c.unitPrice,
          };
        }
        return c;
      }),
    }));
    get().computeTotals();
  },

  updateItemNotes: (itemId, notes) => {
    set((state) => ({
      cart: state.cart.map((c) => (c.itemId === itemId ? { ...c, notes } : c)),
    }));
  },

  updateItemPrice: (itemId, price) => {
    set((state) => ({
      cart: state.cart.map((c) => {
        if (c.itemId === itemId) {
          return { ...c, unitPrice: price, totalPrice: price * c.quantity };
        }
        return c;
      }),
    }));
    get().computeTotals();
  },

  updateServiceType: (itemId, type) => {
    set((state) => ({
      cart: state.cart.map((c) => {
        if (c.itemId === itemId) {
          let newPrice = c.fullServicePrice;
          if (type === 'washing_only' && c.washingPrice > 0) newPrice = c.washingPrice;
          if (type === 'ironing_only' && c.ironingPrice > 0) newPrice = c.ironingPrice;
          
          return { 
            ...c, 
            serviceType: type,
            unitPrice: newPrice,
            totalPrice: newPrice * c.quantity
          };
        }
        return c;
      }),
    }));
    get().computeTotals();
  },

  updateProcessingType: (itemId, type) => {
    set((state) => ({
      cart: state.cart.map((c) => {
        if (c.itemId === itemId) {
          // If changed back to normal, clear expected delivery date
          if (type === 'normal') {
            return { ...c, processingType: type, expectedDeliveryAt: undefined };
          }
          return { ...c, processingType: type };
        }
        return c;
      }),
    }));
    get().computeTotals();
  },

  updateExpectedDelivery: (itemId, date) => {
    set((state) => ({
      cart: state.cart.map((c) => (c.itemId === itemId ? { ...c, expectedDeliveryAt: date } : c)),
    }));
  },

  setCustomer: (name, phone, location = '', id?: string) => 
    set({ customerName: name, customerPhone: phone, customerLocation: location, customerId: id }),
  
  clearCustomer: () => 
    set({ customerName: '', customerPhone: '', customerLocation: '', customerId: undefined }),

  setPaymentType: (type) => set({ paymentType: type }),
  
  setUrgent: (isUrgent) => {
    set({ isUrgent });
    get().computeTotals();
  },

  setDiscount: (percent) => {
    const validPercent = Math.max(0, Math.min(100, percent || 0));
    set({ discountPercent: validPercent });
    get().computeTotals();
  },

  setNotes: (notes) => set({ notes }),
  
  setExpectedDeliveryAt: (date) => set({ expectedDeliveryAt: date }),

  setTaxPercent: (percent) => {
    set({ taxPercent: percent });
    get().computeTotals();
  },

  clearCart: () => {
    set({
      cart: [],
      customerId: undefined,
      customerName: '',
      customerPhone: '',
      customerLocation: '',
      paymentType: 'cash',
      isUrgent: false,
      discountPercent: 0,
      notes: '',
      expectedDeliveryAt: undefined,
      subtotal: 0,
      discountAmount: 0,
      urgencyFeeAmount: 0,
      taxAmount: 0,
      total: 0,
    });
  },
}));
