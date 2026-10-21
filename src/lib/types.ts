export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  children?: Category[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  shortDescription: string;
  description: string;
  size: string | null;
  materials: string[];
  colors: string[];
  tags: string[];
  care: string | null;
  stock: number;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  customizable: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isDemo: boolean;
  badge: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  views: number;
  whatsappClicks: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  reviewCount?: number;
};

export type OrderItem = {
  productId: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  note?: string;
};

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "IN_MAKING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "New / Pending",
  CONFIRMED: "Confirmed",
  IN_MAKING: "Being Made",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  courier: string | null;
  trackingNumber: string | null;
  source: string;
  adminNotes: string | null;
  history: { status: string; at: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
};

export type CustomRequest = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: string | null;
  description: string;
  size: string | null;
  colors: string | null;
  budget: string | null;
  deadline: string | null;
  aiConcept: string | null;
  status: string;
  quotedPrice: number | null;
  adminNotes: string | null;
  createdAt: string;
};

export type Review = {
  id: string;
  productId: string | null;
  productName?: string | null;
  name: string;
  city: string | null;
  rating: number;
  comment: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrder: number;
  isActive: boolean;
  expiresAt: string | null;
  usageCount: number;
  createdAt: string;
};

export type HeroSlide = {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type FaqItem = { q: string; a: string };

/** A home-page category tile: photo, script title, one line and where it links. */
export type HomeTile = { title: string; text: string; image: string; link: string };
/** One step of "From Clay to Your Wall" on the home page. */
export type MakingStep = { title: string; body: string; image: string };

export type StoreSettings = {
  theme: string;
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  youtube: string;
  address: string;
  currencySymbol: string;
  shippingFee: number;
  freeShippingAbove: number;
  giftWrapFee: number;
  codAvailable: boolean;
  upiId: string;
  orderNote: string;
  announcement: string;
  announcementActive: boolean;
  acceptingOrders: boolean;
  vacationMessage: string;
  heroSlides: HeroSlide[];
  aboutTitle: string;
  aboutStory: string;
  artistName: string;
  artistImage: string;
  /** Big portrait on the About page; empty = the artist photo, then the brand board */
  aboutPageImage: string;
  homeTiles: HomeTile[];
  makingSteps: MakingStep[];
  /** "Made for your home, by name" photo; empty = a customisable product's photo */
  commissionImage: string;
  /** Picture shown when the site is shared on WhatsApp/Facebook (1200×630 works best) */
  shareImage: string;
  faqs: FaqItem[];
  shippingPolicy: string;
  returnPolicy: string;
  careGuide: string;
  aiAssistantEnabled: boolean;
  aiAssistantName: string;
  seoDescription: string;
};
