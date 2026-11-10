import { db } from "./db";
import { products, admins, orders, auditLogs, videos, siteVisitors, homeSections, notFoundLogs, reviews, featuredSlides, couponCodes, customers, deliveryFees, wishlists, pushSubscriptions, type Product, type InsertProduct, type Admin, type InsertAdmin, type Order, type InsertOrder, type AuditLog, type InsertAuditLog, type Video, type InsertVideo, type SiteVisitor, type InsertSiteVisitor, type HomeSection, type InsertHomeSection, type NotFoundLog, type InsertNotFoundLog, type Review, type InsertReview, type FeaturedSlide, type InsertFeaturedSlide, type CouponCode, type InsertCouponCode, type Customer, type DeliveryFee, type Wishlist, type PushSubscription } from "@shared/schema";
import { eq, like, and, desc, gte, lte, or, count, countDistinct } from "drizzle-orm";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const REVENUE_STATUSES = new Set([
  "paid", "shipped", "completed", "delivered", "confirmed", "processing", "pending",
]);

function isRevenueOrder(order: Order): boolean {
  if (order.paymentMethod === "MTN Mobile Money") {
    return order.paymentState === "SUCCEEDED" && REVENUE_STATUSES.has(order.status);
  }
  return REVENUE_STATUSES.has(order.status);
}

function isPaidOrder(order: Order): boolean {
  const paidStatuses = new Set(["paid", "processing", "shipped", "completed", "delivered", "confirmed"]);
  if (!paidStatuses.has(order.status)) return false;
  return order.paymentMethod !== "MTN Mobile Money" || order.paymentState === "SUCCEEDED";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (existing.length === 0) break;
    if (existing[0].id === excludeId) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export interface IStorage {
  getProducts(filters?: { category?: string; featured?: boolean; search?: string; stockStatus?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Admin methods
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  getAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, data: Partial<Admin>): Promise<Admin>;
  deleteAdmin(id: number): Promise<void>;

  // Order methods
  getOrders(filters?: { search?: string; status?: string; startDate?: string; endDate?: string }): Promise<Order[]>;
  getOrdersPaginated(filters?: { search?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<PaginatedResult<Order>>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderByTrackingCode(trackingCode: string): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getProductByNameAndBrand(name: string, brand: string): Promise<Product | undefined>;
  getAdminStats(filters?: { startDate?: string; endDate?: string }): Promise<any>;
  getPeriodicAnalytics(period: "day" | "week" | "month", filters?: { startDate?: string; endDate?: string }): Promise<{ 
    period: string; 
    orders: number; 
    revenue: number;
    aov: number;
  }[]>;
  getDailyAnalytics(filters?: { startDate?: string; endDate?: string }): Promise<{ date: string; orders: number; revenue: number }[]>;

  // Audit methods
  getAuditLogs(): Promise<AuditLog[]>;
  getAuditLogsPaginated(filters?: { page?: number; limit?: number; actionType?: string }): Promise<PaginatedResult<AuditLog>>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Dashboard Aggregation
  getDashboardOverview(filters?: { startDate?: string; endDate?: string }): Promise<any>;

  // Visitor tracking
  trackVisitor(visitor: InsertSiteVisitor): Promise<SiteVisitor>;
  getVisitorStats(filters?: { startDate?: string; endDate?: string }): Promise<{ totalVisitors: number; uniqueVisitors: number }>;

  // Video methods
  getVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  deleteVideo(id: number): Promise<void>;

  // Home Section methods
  getHomeSections(): Promise<HomeSection[]>;
  getHomeSectionsActive(): Promise<HomeSection[]>;
  createHomeSection(section: InsertHomeSection): Promise<HomeSection>;
  updateHomeSection(id: number, section: Partial<InsertHomeSection>): Promise<HomeSection>;
  deleteHomeSection(id: number): Promise<void>;

  // 404 Logging methods
  logNotFound(log: InsertNotFoundLog): Promise<NotFoundLog>;
  getNotFoundLogs(filters?: { limit?: number; offset?: number }): Promise<NotFoundLog[]>;
  getNotFoundLogsSummary(): Promise<NotFoundLog[]>;

  // Review methods
  getReviewsByProduct(productId: number, status?: string): Promise<Review[]>;
  getAllReviews(status?: string): Promise<(Review & { productName?: string })[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReviewStatus(id: number, status: string): Promise<Review>;
  deleteReview(id: number): Promise<void>;
  getReviewStats(productId: number): Promise<{ averageRating: number; reviewCount: number }>;
  getAllReviewStats(): Promise<Record<number, { averageRating: number; reviewCount: number }>>;
  getPendingReviewCount(): Promise<number>;

  // Featured Slides methods
  getFeaturedSlides(): Promise<FeaturedSlide[]>;
  getFeaturedSlidesActive(): Promise<FeaturedSlide[]>;
  createFeaturedSlide(slide: InsertFeaturedSlide): Promise<FeaturedSlide>;
  updateFeaturedSlide(id: number, slide: Partial<InsertFeaturedSlide>): Promise<FeaturedSlide>;
  deleteFeaturedSlide(id: number): Promise<void>;

  // Coupon Code methods
  getCouponCodes(): Promise<CouponCode[]>;
  getActiveCouponCodes(): Promise<CouponCode[]>;
  getCouponByCode(code: string): Promise<CouponCode | undefined>;
  createCouponCode(coupon: InsertCouponCode): Promise<CouponCode>;
  updateCouponCode(id: number, data: Partial<InsertCouponCode>): Promise<CouponCode>;
  deleteCouponCode(id: number): Promise<void>;
  incrementCouponUsage(id: number): Promise<CouponCode>;

  // Customer auth methods
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByGoogleId(googleId: string): Promise<Customer | undefined>;
  createCustomer(data: { fullName: string; email: string; phone: string; passwordHash: string; googleId?: string; avatar?: string }): Promise<Customer>;
  getCustomers(): Promise<Customer[]>;
  updateCustomerPassword(id: number, passwordHash: string): Promise<Customer>;
  updateCustomerGoogleId(id: number, googleId: string, avatar?: string): Promise<Customer>;
  getOrdersByCustomerEmail(email: string): Promise<Order[]>;

  // Delivery fee methods
  getDeliveryFees(): Promise<DeliveryFee[]>;
  getDeliveryFeeBySector(sector: string): Promise<DeliveryFee | undefined>;
  updateDeliveryFee(sector: string, fee: number): Promise<DeliveryFee>;

  // Wishlist methods
  getWishlistByCustomerId(customerId: number): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(customerId: number, productId: number): Promise<Wishlist>;
  removeFromWishlist(customerId: number, productId: number): Promise<void>;

  // Push subscription methods
  createPushSubscription(adminId: number, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscriptionByEndpoint(endpoint: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(filters?: { category?: string; featured?: boolean; search?: string; stockStatus?: string }): Promise<Product[]> {
    let conditions = [];

    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }
    if (filters?.featured) {
      conditions.push(eq(products.isFeatured, true));
    }
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      conditions.push(or(
        like(products.name, `%${searchTerm}%`),
        like(products.brand, `%${searchTerm}%`),
        like(products.category, `%${searchTerm}%`),
        like(products.description, `%${searchTerm}%`)
      ));
    }
    if (filters?.stockStatus) {
      conditions.push(eq(products.stockStatus, filters.stockStatus));
    }

    if (conditions.length > 0) {
      return await db.select().from(products).where(and(...conditions));
    }

    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: any): Promise<Product> {
    const baseSlug = generateSlug(product.name);
    const slug = await ensureUniqueSlug(baseSlug);
    const [newProduct] = await db.insert(products).values({ ...product, slug }).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: any): Promise<Product> {
    let updateData: any = { ...product };
    if (product.name) {
      const baseSlug = generateSlug(product.name);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    if (!updatedProduct) throw new Error("Product not found");
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    if (!deletedProduct) throw new Error("Product not found");
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdmins(): Promise<Admin[]> {
    return await db.select().from(admins).orderBy(desc(admins.createdAt));
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  async updateAdmin(id: number, data: Partial<Admin>): Promise<Admin> {
    const [updatedAdmin] = await db
      .update(admins)
      .set(data)
      .where(eq(admins.id, id))
      .returning();
    if (!updatedAdmin) throw new Error("Admin not found");
    return updatedAdmin;
  }

  async deleteAdmin(id: number): Promise<void> {
    await db.delete(admins).where(eq(admins.id, id));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrders(filters?: { search?: string; status?: string; startDate?: string; endDate?: string }): Promise<Order[]> {
    let finalConditions = [];
    if (filters?.search) {
      finalConditions.push(or(
        like(orders.customerName, `%${filters.search}%`),
        like(orders.customerPhone, `%${filters.search}%`)
      ));
    }
    if (filters?.status) {
      finalConditions.push(eq(orders.status, filters.status));
    }
    if (filters?.startDate) {
      finalConditions.push(gte(orders.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      finalConditions.push(lte(orders.createdAt, new Date(filters.endDate)));
    }

    if (finalConditions.length > 0) {
      return await db.select().from(orders).where(and(...finalConditions)).orderBy(desc(orders.createdAt));
    }

    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersPaginated(filters?: { search?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<PaginatedResult<Order>> {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 20));
    const offset = (page - 1) * limit;

    let finalConditions = [];
    if (filters?.search) {
      finalConditions.push(or(
        like(orders.customerName, `%${filters.search}%`),
        like(orders.customerPhone, `%${filters.search}%`)
      ));
    }
    if (filters?.status) {
      finalConditions.push(eq(orders.status, filters.status));
    }
    if (filters?.startDate) {
      finalConditions.push(gte(orders.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      finalConditions.push(lte(orders.createdAt, new Date(filters.endDate)));
    }

    const whereClause = finalConditions.length > 0 ? and(...finalConditions) : undefined;

    const allOrders = whereClause 
      ? await db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).orderBy(desc(orders.createdAt));

    const total = allOrders.length;
    const data = allOrders.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getOrderByTrackingCode(trackingCode: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.trackingCode, trackingCode.toUpperCase()));
    return order;
  }

  async createOrder(order: any): Promise<Order> {
    // Generate a unique 8-character tracking code (uppercase alphanumeric,
    // excluding ambiguous characters 0/O/1/I) with a collision-retry loop.
    const TRACKING_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const generateTrackingCode = () => {
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += TRACKING_CODE_CHARS.charAt(Math.floor(Math.random() * TRACKING_CODE_CHARS.length));
      }
      return code;
    };

    let trackingCode = generateTrackingCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [existing] = await db.select({ id: orders.id }).from(orders).where(eq(orders.trackingCode, trackingCode));
      if (!existing) break;
      trackingCode = generateTrackingCode();
    }

    return await db.transaction(async (tx) => {
      // 1. Validate and Deduct Stock
      for (const item of order.items || []) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (item.storage || item.color) {
          const variations = { ...(product.variations || {}) };
          let updated = false;
          let prevStock: number | undefined;
          let newStock: number | undefined;
          let variationLabel = "";

          if (item.storage && variations.storage) {
            const storageOpt = variations.storage.find((s: any) => s.option === item.storage);
            if (storageOpt) {
              if ((storageOpt.stock ?? 0) < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name} (${item.storage})`);
              }
              prevStock = storageOpt.stock;
              storageOpt.stock = (storageOpt.stock ?? 0) - item.quantity;
              newStock = storageOpt.stock;
              variationLabel = item.storage;
              updated = true;
            }
          }

          if (item.color && variations.colors) {
            const colorOpt = variations.colors.find((c: any) => c.name === item.color);
            if (colorOpt) {
              if ((colorOpt.stock ?? 0) < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name} (${item.color})`);
              }
              prevStock = prevStock ?? colorOpt.stock; 
              colorOpt.stock = (colorOpt.stock ?? 0) - item.quantity;
              newStock = colorOpt.stock;
              variationLabel = variationLabel ? `${variationLabel}, ${item.color}` : item.color;
              updated = true;
            }
          }

          if (updated) {
            await tx.update(products).set({ variations }).where(eq(products.id, product.id));
            await tx.insert(auditLogs).values({
              action: `Stock Deducted (Order Creation): ${product.name} (${variationLabel}) x${item.quantity}`,
              adminEmail: "system",
              actionType: "stock_deduction",
              targetType: "Product",
              targetId: product.id,
              previousValue: prevStock?.toString(),
              newValue: newStock?.toString(),
            }).catch(err => console.error("Audit log failed:", err));
          }
        }
      }

      // 2. Create Order
      const [newOrder] = await tx.insert(orders).values({
        trackingCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail || null,
        deliveryLocation: order.deliveryLocation || null,
        deliveryProvince: order.deliveryProvince || null,
        deliveryDistrict: order.deliveryDistrict || null,
        deliverySector: order.deliverySector || null,
        deliveryCell: order.deliveryCell || null,
        deliveryLandmark: order.deliveryLandmark || null,
        deliveryLatitude: order.deliveryLatitude || null,
        deliveryLongitude: order.deliveryLongitude || null,
        orderType: order.orderType || "Delivery",
        orderDate: order.orderDate || null,
        orderTime: order.orderTime || null,
        orderNotes: order.orderNotes || null,
        paymentMethod: order.paymentMethod || null,
        paymentProvider: order.paymentProvider || null,
        paymentReference: order.paymentReference || null,
        paymentPhone: order.paymentPhone || null,
        paymentState: order.paymentState || null,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee || 0,
        currency: order.currency || "RWF",
        status: order.status || "pending",
        items: order.items || [],
      }).returning();

      return newOrder;
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id));
      if (!order) throw new Error("Order not found");

      const oldStatus = order.status;
      const nextStatus = status;

      if (nextStatus === "confirmed" && oldStatus !== "confirmed") {
        for (const item of order.items || []) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (!product) continue;

          if (item.storage || item.color) {
            const variations = product.variations || {};
            let updated = false;
            let prevStock: number | undefined;
            let newStock: number | undefined;

            if (item.storage && variations.storage) {
              const storageOpt = variations.storage.find((s: any) => s.option === item.storage);
              if (storageOpt) {
                if ((storageOpt.stock ?? 0) < item.quantity) {
                  throw new Error(`Insufficient stock for ${product.name} (${item.storage})`);
                }
                prevStock = storageOpt.stock;
                storageOpt.stock = (storageOpt.stock ?? 0) - item.quantity;
                newStock = storageOpt.stock;
                updated = true;
              }
            }

            if (item.color && variations.colors) {
              const colorOpt = variations.colors.find((c: any) => c.name === item.color);
              if (colorOpt) {
                if ((colorOpt.stock ?? 0) < item.quantity) {
                  throw new Error(`Insufficient stock for ${product.name} (${item.color})`);
                }
                prevStock = colorOpt.stock;
                colorOpt.stock = (colorOpt.stock ?? 0) - item.quantity;
                newStock = colorOpt.stock;
                updated = true;
              }
            }

            if (updated) {
              await tx.update(products).set({ variations }).where(eq(products.id, product.id));
              await tx.insert(auditLogs).values({
                action: `Stock Deducted: ${product.name} (${item.storage || item.color}) x${item.quantity}`,
                adminEmail: "system",
                actionType: "stock_deduction",
                targetType: "Product",
                targetId: product.id,
                previousValue: prevStock?.toString(),
                newValue: newStock?.toString(),
              }).catch(err => console.error("Audit log failed:", err));
            }
          }
        }
      }

      const isReverting =
        ((oldStatus === "confirmed" || oldStatus === "paid") && (nextStatus === "pending" || nextStatus === "cancelled")) ||
        (oldStatus === "pending" && (nextStatus === "cancelled" || nextStatus === "failed"));
      if (isReverting) {
        for (const item of order.items || []) {
          const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (!product) continue;

          if (item.storage || item.color) {
            const variations = product.variations || {};
            let updated = false;
            let prevStock: number | undefined;
            let newStock: number | undefined;

            if (item.storage && variations.storage) {
              const storageOpt = variations.storage.find((s: any) => s.option === item.storage);
              if (storageOpt) {
                prevStock = storageOpt.stock;
                storageOpt.stock = (storageOpt.stock ?? 0) + item.quantity;
                newStock = storageOpt.stock;
                updated = true;
              }
            }

            if (item.color && variations.colors) {
              const colorOpt = variations.colors.find((c: any) => c.name === item.color);
              if (colorOpt) {
                prevStock = colorOpt.stock;
                colorOpt.stock = (colorOpt.stock ?? 0) + item.quantity;
                newStock = colorOpt.stock;
                updated = true;
              }
            }

            if (updated) {
              await tx.update(products).set({ variations }).where(eq(products.id, product.id));
              await tx.insert(auditLogs).values({
                action: `Stock Restored (${nextStatus === 'cancelled' ? 'Cancellation' : 'Revert'}): ${product.name} (${item.storage || item.color}) x${item.quantity}`,
                adminEmail: "system",
                actionType: "stock_restoration",
                targetType: "Product",
                targetId: product.id,
                previousValue: prevStock?.toString(),
                newValue: newStock?.toString(),
              }).catch(err => console.error("Audit log failed:", err));
            }
          }
        }
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({ status: nextStatus })
        .where(eq(orders.id, id))
        .returning();

      return updatedOrder;
    });
  }

  async getProductByNameAndBrand(name: string, brand: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.name, name), eq(products.brand, brand)));
    return product;
  }

  async getAdminStats(filters?: { startDate?: string; endDate?: string }): Promise<any> {
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);

    let currentPeriodOrders = allOrders;
    if (filters?.startDate || filters?.endDate) {
      currentPeriodOrders = allOrders.filter(o => {
        const date = new Date(o.createdAt);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    }

    const revenueOrders = currentPeriodOrders.filter(isRevenueOrder);
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const paidOrders = currentPeriodOrders.filter(isPaidOrder);
    const lowStockProducts = allProducts.flatMap(product => {
      if (product.stockStatus === "out_of_stock") return [{ id: product.id, name: product.name, stock: 0 }];
      const variantStocks = [
        ...(product.variations?.storage || []).map(variant => variant.stock),
        ...(product.variations?.colors || []).map(variant => variant.stock),
      ].filter((stock): stock is number => typeof stock === "number" && Number.isFinite(stock));
      const stock = variantStocks.reduce((total, value) => total + value, 0);
      return variantStocks.length > 0 && stock <= 5 ? [{ id: product.id, name: product.name, stock }] : [];
    }).slice(0, 8);

    const [totalAdmins] = await db.select({ value: count() }).from(admins);

    return {
      totalOrders: currentPeriodOrders.length,
      paidOrders: paidOrders.length,
      totalRevenue,
      totalProducts: allProducts.length,
      pendingOrders: currentPeriodOrders.filter(o => o.status === "pending").length,
      lowStockProducts,
      totalAdmins: totalAdmins?.value || 0,
      recentOrders: [...currentPeriodOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    };
  }

  async getPeriodicAnalytics(period: "day" | "week" | "month", filters?: { startDate?: string; endDate?: string }): Promise<{ 
    period: string; 
    orders: number; 
    revenue: number;
    aov: number;
  }[]> {
    let allOrders = await db.select().from(orders);
    if (filters?.startDate || filters?.endDate) {
      allOrders = allOrders.filter(o => {
        const date = new Date(o.createdAt);
        if (filters.startDate && date < new Date(filters.startDate)) return false;
        if (filters.endDate && date > new Date(filters.endDate)) return false;
        return true;
      });
    }
    const periodicData: Record<string, { orders: number; revenue: number }> = {};

    allOrders.forEach(order => {
      const date = new Date(order.createdAt);
      let periodKey: string;

      if (period === "day") {
        periodKey = date.toISOString().split('T')[0];
      } else if (period === "week") {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        periodKey = startOfWeek.toISOString().split('T')[0];
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!periodicData[periodKey]) {
        periodicData[periodKey] = { orders: 0, revenue: 0 };
      }

      periodicData[periodKey].orders += 1;
      if (isRevenueOrder(order)) {
        periodicData[periodKey].revenue += order.totalAmount;
      }
    });

    return Object.entries(periodicData).map(([key, data]) => ({
      period: key,
      orders: data.orders,
      revenue: data.revenue,
      aov: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0
    })).sort((a, b) => a.period.localeCompare(b.period));
  }

  async getDailyAnalytics(filters?: { startDate?: string; endDate?: string }): Promise<{ date: string; orders: number; revenue: number }[]>{
    const analytics = await this.getPeriodicAnalytics("day", filters);
    return analytics.map(a => ({ date: a.period, orders: a.orders, revenue: a.revenue }));
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
  }

  async getAuditLogsPaginated(filters?: { page?: number; limit?: number; actionType?: string }): Promise<PaginatedResult<AuditLog>> {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 50));
    const offset = (page - 1) * limit;

    let allLogs: AuditLog[];
    if (filters?.actionType) {
      allLogs = await db.select().from(auditLogs)
        .where(eq(auditLogs.actionType, filters.actionType))
        .orderBy(desc(auditLogs.timestamp));
    } else {
      allLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
    }

    const total = allLogs.length;
    const data = allLogs.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getDashboardOverview(filters?: { startDate?: string; endDate?: string }): Promise<any> {
    const allOrders = await db.select().from(orders);
    const catalog = await db.select({ id: products.id, name: products.name, category: products.category }).from(products);
    const catalogById = new Map(catalog.map(product => [product.id, product]));

    let filteredOrders = allOrders;
    if (filters?.startDate || filters?.endDate) {
      filteredOrders = allOrders.filter(o => {
        const date = new Date(o.createdAt);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    }

    const totalOrders = filteredOrders.length;
    const paidOrdersList = filteredOrders.filter(isRevenueOrder);
    const paidOrders = filteredOrders.filter(isPaidOrder).length;
    const pendingOrders = filteredOrders.filter(o => o.status === "pending").length;
    const totalRevenue = paidOrdersList.reduce((sum, o) => sum + o.totalAmount, 0);
    const chartData = await this.getDailyAnalytics(filters);
    let previousFilters: { startDate?: string; endDate?: string } | undefined;
    if (filters?.startDate) {
      const currentStart = new Date(filters.startDate);
      const currentEnd = filters.endDate ? new Date(filters.endDate) : new Date();
      const periodMs = Math.max(24 * 60 * 60 * 1000, currentEnd.getTime() - currentStart.getTime());
      previousFilters = {
        startDate: new Date(currentStart.getTime() - periodMs).toISOString(),
        endDate: new Date(currentStart.getTime() - 1).toISOString(),
      };
    }
    const previousOrders = previousFilters
      ? allOrders.filter(order => {
          const date = new Date(order.createdAt);
          return date >= new Date(previousFilters!.startDate!) && date <= new Date(previousFilters!.endDate!);
        })
      : [];
    const previousRevenueOrders = previousOrders.filter(isRevenueOrder);
    const previousZoneSales = new Map<string, number>();
    for (const order of previousRevenueOrders) {
      const zone = order.deliveryDistrict || order.deliveryLocation || (order.orderType === "Pickup" ? "Store pickup" : "Other locations");
      previousZoneSales.set(zone, (previousZoneSales.get(zone) || 0) + order.totalAmount);
    }

    const categoryTotals = new Map<string, { category: string; sales: number; units: number }>();
    const bestSellers = new Map<number, { productId: number; name: string; category: string; units: number; sales: number }>();
    for (const order of paidOrdersList) {
      for (const item of order.items || []) {
        const product = catalogById.get(item.productId);
        const category = product?.category || "Other";
        const name = product?.name || item.name || "Unknown product";
        const units = Math.max(0, Number(item.quantity) || 0);
        const sales = units * (Number(item.price) || 0);
        const categoryTotal = categoryTotals.get(category) || { category, sales: 0, units: 0 };
        categoryTotal.sales += sales;
        categoryTotal.units += units;
        categoryTotals.set(category, categoryTotal);
        const bestSeller = bestSellers.get(item.productId) || { productId: item.productId, name, category, units: 0, sales: 0 };
        bestSeller.units += units;
        bestSeller.sales += sales;
        bestSellers.set(item.productId, bestSeller);
      }
    }

    const channelTotals = new Map<string, number>();
    for (const order of filteredOrders) {
      const channel = order.source || "Website";
      channelTotals.set(channel, (channelTotals.get(channel) || 0) + 1);
    }
    const zoneTotals = new Map<string, { zone: string; orders: number; revenue: number }>();
    for (const order of filteredOrders) {
      const zone = order.deliveryDistrict || order.deliveryLocation || (order.orderType === "Pickup" ? "Store pickup" : "Other locations");
      const current = zoneTotals.get(zone) || { zone, orders: 0, revenue: 0 };
      current.orders += 1;
      if (isRevenueOrder(order)) current.revenue += order.totalAmount;
      zoneTotals.set(zone, current);
    }
    const statusGroups = [
      { status: "Pending", count: filteredOrders.filter(order => order.status === "pending").length },
      { status: "Paid", count: filteredOrders.filter(order => order.status === "paid").length },
      { status: "Fulfilled", count: filteredOrders.filter(order => ["processing", "shipped", "completed", "delivered", "confirmed"].includes(order.status)).length },
      { status: "Cancelled", count: filteredOrders.filter(order => ["cancelled", "failed", "refunded"].includes(order.status)).length },
    ];

    return {
      totalOrders,
      paidOrders,
      pendingOrders,
      totalRevenue,
      chartData,
      previousChartData: previousFilters ? await this.getDailyAnalytics(previousFilters) : [],
      categorySales: Array.from(categoryTotals.values()).sort((a, b) => b.sales - a.sales),
      bestSellers: Array.from(bestSellers.values()).sort((a, b) => b.units - a.units).slice(0, 8),
      channelSales: Array.from(channelTotals.entries()).map(([channel, orders]) => ({ channel, orders })),
      zoneSales: Array.from(zoneTotals.values()).sort((a, b) => b.orders - a.orders).slice(0, 6).map(zone => ({
        ...zone,
        change: previousZoneSales.has(zone.zone) && previousZoneSales.get(zone.zone)! > 0
          ? Math.round(((zone.revenue - previousZoneSales.get(zone.zone)!) / previousZoneSales.get(zone.zone)!) * 100)
          : null,
      })),
      statusGroups,
    };
  }

  async trackVisitor(visitor: InsertSiteVisitor): Promise<SiteVisitor> {
    const [newVisitor] = await db.insert(siteVisitors).values(visitor).returning();
    return newVisitor;
  }

  async getVisitorStats(filters?: { startDate?: string; endDate?: string }): Promise<{ totalVisitors: number; uniqueVisitors: number }> {
    let conditions = [];
    if (filters?.startDate) conditions.push(gte(siteVisitors.timestamp, new Date(filters.startDate)));
    if (filters?.endDate) conditions.push(lte(siteVisitors.timestamp, new Date(filters.endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db.select({ value: count() }).from(siteVisitors).where(whereClause);
    const [uniqueRes] = await db.select({ value: countDistinct(siteVisitors.visitorId) }).from(siteVisitors).where(whereClause);

    return {
      totalVisitors: Number(totalRes?.value || 0),
      uniqueVisitors: Number(uniqueRes?.value || 0)
    };
  }

  async getVideos(): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.order), desc(videos.createdAt));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async getHomeSections(): Promise<HomeSection[]> {
    return await db.select().from(homeSections).orderBy(homeSections.order);
  }

  async getHomeSectionsActive(): Promise<HomeSection[]> {
    return await db.select().from(homeSections).where(eq(homeSections.isActive, true)).orderBy(homeSections.order);
  }

  async createHomeSection(section: InsertHomeSection): Promise<HomeSection> {
    const [newSection] = await db.insert(homeSections).values(section).returning();
    return newSection;
  }

  async updateHomeSection(id: number, section: Partial<InsertHomeSection>): Promise<HomeSection> {
    const [updatedSection] = await db.update(homeSections).set(section).where(eq(homeSections.id, id)).returning();
    if (!updatedSection) throw new Error("Home section not found");
    return updatedSection;
  }

  async deleteHomeSection(id: number): Promise<void> {
    await db.delete(homeSections).where(eq(homeSections.id, id));
  }

  async logNotFound(log: InsertNotFoundLog): Promise<NotFoundLog> {
    const existing = await db.select().from(notFoundLogs).where(eq(notFoundLogs.url, log.url)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(notFoundLogs)
        .set({ count: existing[0].count + 1, lastSeen: new Date() })
        .where(eq(notFoundLogs.url, log.url))
        .returning();
      return updated;
    }
    const [created] = await db.insert(notFoundLogs).values(log).returning();
    return created;
  }

  async getNotFoundLogs(filters?: { limit?: number; offset?: number }): Promise<NotFoundLog[]> {
    let query = db.select().from(notFoundLogs).orderBy(desc(notFoundLogs.count));
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    return query;
  }

  async getNotFoundLogsSummary(): Promise<NotFoundLog[]> {
    return db.select().from(notFoundLogs).orderBy(desc(notFoundLogs.count)).limit(50);
  }

  async getReviewsByProduct(productId: number, status?: string): Promise<Review[]> {
    const conditions = [eq(reviews.productId, productId)];
    if (status) conditions.push(eq(reviews.status, status));
    return db.select().from(reviews).where(and(...conditions)).orderBy(desc(reviews.createdAt));
  }

  async getAllReviews(status?: string): Promise<(Review & { productName?: string })[]> {
    const allReviews = status
      ? await db.select().from(reviews).where(eq(reviews.status, status)).orderBy(desc(reviews.createdAt))
      : await db.select().from(reviews).orderBy(desc(reviews.createdAt));
    const allProducts = await db.select({ id: products.id, name: products.name }).from(products);
    const productMap = Object.fromEntries(allProducts.map(p => [p.id, p.name]));
    return allReviews.map(r => ({ ...r, productName: productMap[r.productId] || `Product #${r.productId}` }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values({ ...review, status: "pending" }).returning();
    return created;
  }

  async updateReviewStatus(id: number, status: string): Promise<Review> {
    const [updated] = await db.update(reviews).set({ status }).where(eq(reviews.id, id)).returning();
    return updated;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async getReviewStats(productId: number): Promise<{ averageRating: number; reviewCount: number }> {
    const result = await db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));
    if (result.length === 0) return { averageRating: 0, reviewCount: 0 };
    const total = result.reduce((sum, r) => sum + r.rating, 0);
    return { averageRating: Math.round((total / result.length) * 10) / 10, reviewCount: result.length };
  }

  async getAllReviewStats(): Promise<Record<number, { averageRating: number; reviewCount: number }>> {
    const approved = await db.select().from(reviews).where(eq(reviews.status, "approved"));
    const stats: Record<number, { total: number; count: number }> = {};
    for (const r of approved) {
      if (!stats[r.productId]) stats[r.productId] = { total: 0, count: 0 };
      stats[r.productId].total += r.rating;
      stats[r.productId].count += 1;
    }
    return Object.fromEntries(
      Object.entries(stats).map(([id, s]) => [id, { averageRating: Math.round((s.total / s.count) * 10) / 10, reviewCount: s.count }])
    );
  }

  async getPendingReviewCount(): Promise<number> {
    const result = await db.select().from(reviews).where(eq(reviews.status, "pending"));
    return result.length;
  }

  async getFeaturedSlides(): Promise<FeaturedSlide[]> {
    return db.select().from(featuredSlides).orderBy(featuredSlides.order);
  }

  async getFeaturedSlidesActive(): Promise<FeaturedSlide[]> {
    return db.select().from(featuredSlides).where(eq(featuredSlides.isActive, true)).orderBy(featuredSlides.order);
  }

  async createFeaturedSlide(slide: InsertFeaturedSlide): Promise<FeaturedSlide> {
    const [created] = await db.insert(featuredSlides).values(slide).returning();
    return created;
  }

  async updateFeaturedSlide(id: number, slide: Partial<InsertFeaturedSlide>): Promise<FeaturedSlide> {
    const [updated] = await db.update(featuredSlides).set(slide).where(eq(featuredSlides.id, id)).returning();
    if (!updated) throw new Error("Slide not found");
    return updated;
  }

  async deleteFeaturedSlide(id: number): Promise<void> {
    await db.delete(featuredSlides).where(eq(featuredSlides.id, id));
  }

  async getCouponCodes(): Promise<CouponCode[]> {
    return db.select().from(couponCodes).orderBy(desc(couponCodes.createdAt));
  }

  async getActiveCouponCodes(): Promise<CouponCode[]> {
    const now = new Date();
    const all = await db.select().from(couponCodes)
      .where(eq(couponCodes.isActive, true))
      .orderBy(desc(couponCodes.createdAt));
    return all.filter(c => {
      if (c.maxUses !== null && c.usedCount >= c.maxUses) return false;
      if (c.expiresAt && c.expiresAt < now) return false;
      return true;
    });
  }

  async getCouponByCode(code: string): Promise<CouponCode | undefined> {
    const [found] = await db.select().from(couponCodes).where(eq(couponCodes.code, code.toUpperCase())).limit(1);
    return found;
  }

  async createCouponCode(coupon: InsertCouponCode): Promise<CouponCode> {
    const [created] = await db.insert(couponCodes).values({
      ...coupon,
      code: coupon.code.toUpperCase(),
    }).returning();
    return created;
  }

  async updateCouponCode(id: number, data: Partial<InsertCouponCode>): Promise<CouponCode> {
    const updateData = { ...data };
    if (updateData.code) updateData.code = updateData.code.toUpperCase();
    const [updated] = await db.update(couponCodes).set(updateData).where(eq(couponCodes.id, id)).returning();
    if (!updated) throw new Error("Coupon not found");
    return updated;
  }

  async deleteCouponCode(id: number): Promise<void> {
    await db.delete(couponCodes).where(eq(couponCodes.id, id));
  }

  async incrementCouponUsage(id: number): Promise<CouponCode> {
    const [coupon] = await db.select().from(couponCodes).where(eq(couponCodes.id, id)).limit(1);
    if (!coupon) throw new Error("Coupon not found");
    const [updated] = await db.update(couponCodes)
      .set({ usedCount: coupon.usedCount + 1 })
      .where(eq(couponCodes.id, id))
      .returning();
    return updated;
  }

  async getDeliveryFees(): Promise<DeliveryFee[]> {
    return db.select().from(deliveryFees).orderBy(deliveryFees.district, deliveryFees.sector);
  }

  async getDeliveryFeeBySector(sector: string): Promise<DeliveryFee | undefined> {
    const [found] = await db.select().from(deliveryFees).where(eq(deliveryFees.sector, sector)).limit(1);
    return found;
  }

  async updateDeliveryFee(sector: string, fee: number): Promise<DeliveryFee> {
    const [updated] = await db.update(deliveryFees)
      .set({ fee, updatedAt: new Date() })
      .where(eq(deliveryFees.sector, sector))
      .returning();
    if (!updated) throw new Error(`Delivery fee for sector "${sector}" not found`);
    return updated;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [found] = await db.select().from(customers).where(eq(customers.email, email.toLowerCase())).limit(1);
    return found;
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [found] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return found;
  }

  async createCustomer(data: { fullName: string; email: string; phone: string; passwordHash: string; googleId?: string; avatar?: string }): Promise<Customer> {
    const [created] = await db.insert(customers).values({
      ...data,
      email: data.email.toLowerCase(),
    }).returning();
    return created;
  }

  async getCustomerByGoogleId(googleId: string): Promise<Customer | undefined> {
    const [found] = await db.select().from(customers).where(eq(customers.googleId, googleId)).limit(1);
    return found;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async updateCustomerPassword(id: number, passwordHash: string): Promise<Customer> {
    const [updated] = await db.update(customers).set({ passwordHash }).where(eq(customers.id, id)).returning();
    return updated;
  }

  async updateCustomerGoogleId(id: number, googleId: string, avatar?: string): Promise<Customer> {
    const [updated] = await db.update(customers)
      .set({ googleId, ...(avatar ? { avatar } : {}) })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerEmail, email.toLowerCase())).orderBy(desc(orders.createdAt));
  }

  async getWishlistByCustomerId(customerId: number): Promise<(Wishlist & { product: Product })[]> {
    const rows = await db.select({ wishlist: wishlists, product: products })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.customerId, customerId))
      .orderBy(desc(wishlists.createdAt));
    return rows.map(r => ({ ...r.wishlist, product: r.product }));
  }

  async addToWishlist(customerId: number, productId: number): Promise<Wishlist> {
    const [existing] = await db.select().from(wishlists)
      .where(and(eq(wishlists.customerId, customerId), eq(wishlists.productId, productId)))
      .limit(1);
    if (existing) return existing;
    const [created] = await db.insert(wishlists).values({ customerId, productId }).returning();
    return created;
  }

  async removeFromWishlist(customerId: number, productId: number): Promise<void> {
    await db.delete(wishlists)
      .where(and(eq(wishlists.customerId, customerId), eq(wishlists.productId, productId)));
  }

  async createPushSubscription(adminId: number, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> {
    const [existing] = await db.select().from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    if (existing) return existing;
    const [created] = await db.insert(pushSubscriptions).values({ adminId, endpoint, p256dh, auth }).returning();
    return created;
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}

export const storage = new DatabaseStorage();
