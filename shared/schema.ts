import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  searchKeywords: text("search_keywords").array().default([]),
  price: integer("price").notNull(), // Store in RWF
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  imageUrl: text("image_url").notNull(),
  additionalImages: text("additional_images").array().default([]),
  stockStatus: text("stock_status").notNull().default("in_stock"), // in_stock, out_of_stock, pre_order
  isFeatured: boolean("is_featured").default(false),
  isHotDeal: boolean("is_hot_deal").default(false),
  hotDealDiscount: integer("hot_deal_discount").default(0),
  specs: jsonb("specs").$type<Record<string, string>>(), // Key-value pairs for specs
  variations: jsonb("variations").$type<{
    storage?: { option: string; priceOffset: number; stock?: number }[];
    colors?: { name: string; value: string; stock?: number; imageUrl?: string }[];
  }>(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin, staff, editor, sales, accountant
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  adminEmail: text("admin_email").notNull(),
  actionType: text("action_type").notNull().default("unknown"), // "status_change", "stock_deduction", "stock_restoration"
  targetType: text("target_type").notNull().default("unknown"), // "Order", "Product"
  targetId: integer("target_id").notNull().default(0),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  trackingCode: text("tracking_code").unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryLocation: text("delivery_location"),
  deliveryProvince: text("delivery_province"),
  deliveryDistrict: text("delivery_district"),
  deliverySector: text("delivery_sector"),
  deliveryCell: text("delivery_cell"),
  deliveryLandmark: text("delivery_landmark"),
  deliveryLatitude: text("delivery_latitude"),
  deliveryLongitude: text("delivery_longitude"),
  orderType: text("order_type").default("Delivery"), // Pickup or Delivery
  orderDate: text("order_date"),
  orderTime: text("order_time"),
  orderNotes: text("order_notes"),
  paymentMethod: text("payment_method"),
  paymentProvider: text("payment_provider"), // stripe, paypal, manual
  paymentReference: text("payment_reference"), // stripe intent id or paypal order id
  paymentPhone: text("payment_phone"),
  paymentState: text("payment_state"),
  source: text("source").notNull().default("Website"),
  totalAmount: integer("total_amount").notNull(),
  deliveryFee: integer("delivery_fee").default(0),
  currency: text("currency").default("RWF").notNull(),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").$type<{ productId: number; name: string; quantity: number; price: number; storage?: string; color?: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  paymentReferenceIdx: index("orders_payment_reference_idx").on(table.paymentReference),
}));

export const ipayWebhookEvents = pgTable("ipay_webhook_events", {
  eventId: text("event_id").primaryKey(),
  transactionId: text("transaction_id").notNull(),
  state: text("state").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  originalUrl: text("original_url"),
  mimeType: text("mime_type").notNull().default("video/mp4"),
  fileSize: integer("file_size").notNull().default(0),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isCompressed: boolean("is_compressed").default(false).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteVisitors = pgTable("site_visitors", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(), // Session-based or persistent ID
  path: text("path").notNull(),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notFoundLogs = pgTable("not_found_logs", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(), // The broken URL that returned 404
  referrer: text("referrer"), // Where the user came from
  userAgent: text("user_agent"), // Browser info
  count: integer("count").notNull().default(1), // Number of times hit
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
});

export const insertSiteVisitorSchema = createInsertSchema(siteVisitors).omit({ id: true, timestamp: true });
export type SiteVisitor = typeof siteVisitors.$inferSelect;
export type InsertSiteVisitor = z.infer<typeof insertSiteVisitorSchema>;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export const auditLogSchema = auditLogs;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertProductSchema = createInsertSchema(products).omit({ id: true }).extend({ slug: z.string().optional() });
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });

export const homeSections = pgTable("home_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "category_grid", "top_deals", "bestsellers", "new_arrivals", "lowest_prices", "specific_products"
  isActive: boolean("is_active").default(true).notNull(),
  order: integer("order").notNull().default(0),
  categoryFilter: text("category_filter"), // Category to filter products (optional)
  limit: integer("limit").default(8), // Number of products to show
  productIds: integer("product_ids").array(), // Specific product IDs for "specific_products" type
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHomeSectionSchema = createInsertSchema(homeSections).omit({ id: true, createdAt: true, updatedAt: true });
export type HomeSection = typeof homeSections.$inferSelect;
export type InsertHomeSection = z.infer<typeof insertHomeSectionSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export const insertNotFoundLogSchema = createInsertSchema(notFoundLogs).omit({ id: true, firstSeen: true, lastSeen: true });
export type NotFoundLog = typeof notFoundLogs.$inferSelect;
export type InsertNotFoundLog = z.infer<typeof insertNotFoundLogSchema>;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, status: true });
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export const featuredSlides = pgTable("featured_slides", {
  id: serial("id").primaryKey(),
  badge: text("badge").notNull().default("NEW"),
  titleLine1: text("title_line1").notNull(),
  titleLine2: text("title_line2").notNull(),
  description: text("description").notNull(),
  price: integer("price"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull().default("/shop"),
  isActive: boolean("is_active").default(true).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeaturedSlideSchema = createInsertSchema(featuredSlides).omit({ id: true, createdAt: true });
export type FeaturedSlide = typeof featuredSlides.$inferSelect;
export type InsertFeaturedSlide = z.infer<typeof insertFeaturedSlideSchema>;

export const couponCodes = pgTable("coupon_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  discountType: text("discount_type").notNull().default("percentage"), // "percentage" | "fixed"
  discountValue: integer("discount_value").notNull(),
  maxUses: integer("max_uses"), // null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCouponCodeSchema = createInsertSchema(couponCodes).omit({ id: true, createdAt: true, usedCount: true });
export type CouponCode = typeof couponCodes.$inferSelect;
export type InsertCouponCode = z.infer<typeof insertCouponCodeSchema>;

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  googleId: text("google_id").unique(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  customerProductUnique: unique().on(table.customerId, table.productId),
}));

export const insertWishlistSchema = createInsertSchema(wishlists).omit({ id: true, createdAt: true });
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export const deliveryFees = pgTable("delivery_fees", {
  id: serial("id").primaryKey(),
  district: text("district").notNull(),
  sector: text("sector").notNull().unique(),
  fee: integer("fee").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDeliveryFeeSchema = createInsertSchema(deliveryFees).omit({ id: true, updatedAt: true });
export type DeliveryFee = typeof deliveryFees.$inferSelect;
export type InsertDeliveryFee = z.infer<typeof insertDeliveryFeeSchema>;

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Types for API
export type ProductResponse = Product;
