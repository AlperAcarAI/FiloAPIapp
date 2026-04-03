import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  serial,
  integer,
  date,
  decimal,
  bigint,
  primaryKey,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ========================
// Lookup / Reference Tables
// ========================

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  phoneCode: varchar("phone_code", { length: 10 }),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  countryId: integer("country_id").notNull().references(() => countries.id),
});



export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  taxNo: varchar("tax_no", { length: 50 }),
  taxOffice: varchar("tax_office", { length: 100 }),
  address: varchar("address", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  cityId: integer("city_id").references(() => cities.id),
  isActive: boolean("is_active").notNull().default(true),
});

// Company Types Table - müşteri, taşeron, tedarikçi
export const companyTypes = pgTable("company_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// Company Type Matches - Many-to-Many relationship between companies and company types
export const companyTypeMatches = pgTable("company_type_matches", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  typeId: integer("type_id").notNull().references(() => companyTypes.id),
}, (table) => ({
  uniqueCompanyType: unique().on(table.companyId, table.typeId),
}));

// Personnel Company Matches - Tracks personnel employment history across companies
export const personnelCompanyMatches = pgTable("personnel_company_matches", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  positionId: integer("position_id").notNull().references(() => personnelPositions.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  // Bir personel aynı şirkette aynı anda sadece bir aktif kaydı olabilir
  uniqueActivePersonnelCompany: unique().on(table.personnelId, table.companyId, table.isActive),
}));

export const policyTypes = pgTable("policy_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const damageTypes = pgTable("damage_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const ownershipTypes = pgTable("ownership_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const maintenanceTypes = pgTable("maintenance_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

// Stuff Management Tables
export const stuff = pgTable("stuff", {
  id: serial("id").primaryKey(),
  stuffCode: varchar("stuff_code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  value: varchar("value", { length: 255 }),
  type: varchar("type", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const personnelStuffMatcher = pgTable("personnel_stuff_matcher", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  stuffId: integer("stuff_id").notNull().references(() => stuff.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
});

export const carBrands = pgTable("car_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const carTypes = pgTable("car_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const carModels = pgTable("car_models", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").notNull().references(() => carBrands.id),
  name: varchar("name", { length: 100 }).notNull(),
  typeId: integer("type_id").notNull().references(() => carTypes.id),
  capacity: integer("capacity").notNull(),
  detail: text("detail"),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  capacityIdx: index("idx_car_models_capacity").on(table.capacity),
}));

export const personnelPositions = pgTable("personnel_positions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
});

// Position Page Permissions - Pozisyon bazlı sayfa erişim yetkileri
export const positionPagePermissions = pgTable("position_page_permissions", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull().references(() => personnelPositions.id, { onDelete: "cascade" }),
  pageKey: varchar("page_key", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
}, (table) => ({
  uniquePositionPage: unique("unique_position_page").on(table.positionId, table.pageKey),
  positionIdx: index("idx_position_page_position").on(table.positionId),
}));

// ========================
// Personnel Access Control Tables
// ========================

// Access Types - Erişim yetki tipleri
export const accessTypes = pgTable("access_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Personnel Access - Personel erişim yetkileri
export const personnelAccess = pgTable("personnel_access", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id, { onDelete: "cascade" }),
  workareaId: integer("workarea_id").references(() => workAreas.id), // NULL = tüm şantiyeler
  typeId: integer("type_id").notNull().references(() => accessTypes.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => ({
  uniquePersonnelWorkareaType: unique("unique_personnel_workarea_type").on(table.personnelId, table.workareaId, table.typeId),
  personnelIdx: index("idx_personnel_access_personnel").on(table.personnelId),
  workareaIdx: index("idx_personnel_access_workarea").on(table.workareaId),
  typeIdx: index("idx_personnel_access_type").on(table.typeId),
}));

// Personnel Access Zod Schemas
export const insertAccessTypeSchema = createInsertSchema(accessTypes).omit({
  id: true,
  createdAt: true,
});

export const insertPersonnelAccessSchema = createInsertSchema(personnelAccess).omit({
  id: true,
  createdAt: true,
});

export const updatePersonnelAccessSchema = insertPersonnelAccessSchema.partial();

export type AccessType = typeof accessTypes.$inferSelect;
export type InsertAccessType = z.infer<typeof insertAccessTypeSchema>;

export type PersonnelAccess = typeof personnelAccess.$inferSelect;
export type InsertPersonnelAccess = z.infer<typeof insertPersonnelAccessSchema>;
export type UpdatePersonnelAccess = z.infer<typeof updatePersonnelAccessSchema>;

export const docMainTypes = pgTable("doc_main_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const docSubTypes = pgTable("doc_sub_types", {
  id: serial("id").primaryKey(),
  mainTypeId: integer("main_type_id").notNull().references(() => docMainTypes.id),
  name: varchar("name", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isRequiredForPersonnel: boolean("is_required_for_personnel").notNull().default(false),
});

// Doc Main Types Zod Schemas
export const insertDocMainTypeSchema = createInsertSchema(docMainTypes).omit({
  id: true,
});

export const updateDocMainTypeSchema = insertDocMainTypeSchema.partial();

export type DocMainType = typeof docMainTypes.$inferSelect;
export type InsertDocMainType = z.infer<typeof insertDocMainTypeSchema>;
export type UpdateDocMainType = z.infer<typeof updateDocMainTypeSchema>;

// Doc Sub Types Zod Schemas
export const insertDocSubTypeSchema = createInsertSchema(docSubTypes).omit({
  id: true,
});

export const updateDocSubTypeSchema = insertDocSubTypeSchema.partial();

export type DocSubType = typeof docSubTypes.$inferSelect;
export type InsertDocSubType = z.infer<typeof insertDocSubTypeSchema>;
export type UpdateDocSubType = z.infer<typeof updateDocSubTypeSchema>;

// Projects Table - Proje Yönetimi
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  poCompanyId: integer("po_company_id").notNull().references(() => companies.id),
  ppCompanyId: integer("pp_company_id").notNull().references(() => companies.id),
  workAreaId: integer("work_area_id").references(() => workAreas.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).notNull().default('planned'), // planned, active, completed, cancelled
  cityId: integer("city_id").references(() => cities.id),
  projectTotalPrice: decimal("project_total_price", { precision: 15, scale: 2 }),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default('0'), // 0-100 percentage
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  codeIdx: index("idx_projects_code").on(table.code),
  poCompanyIdx: index("idx_projects_po_company").on(table.poCompanyId),
  ppCompanyIdx: index("idx_projects_pp_company").on(table.ppCompanyId),
  workAreaIdx: index("idx_projects_work_area").on(table.workAreaId),
  statusIdx: index("idx_projects_status").on(table.status),
  datesIdx: index("idx_projects_dates").on(table.startDate, table.endDate),
}));

// Projects Zod schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const penaltyTypes = pgTable("penalty_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  penaltyScore: integer("penalty_score").notNull(),
  amountCents: integer("amount_cents").notNull(),
  discountedAmountCents: integer("discounted_amount_cents").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastDate: date("last_date"),
});

// Penalty Types Zod schemas
export const insertPenaltyTypeSchema = createInsertSchema(penaltyTypes).omit({
  id: true,
});
export const updatePenaltyTypeSchema = createInsertSchema(penaltyTypes).omit({
  id: true,
}).partial();
export type InsertPenaltyType = z.infer<typeof insertPenaltyTypeSchema>;
export type UpdatePenaltyType = z.infer<typeof updatePenaltyTypeSchema>;
export type PenaltyType = typeof penaltyTypes.$inferSelect;

// ========================
// Auth & Authorization Tables
// ========================

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").notNull().references(() => roles.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  personnelId: integer("personnel_id").references(() => personnel.id),
  department: varchar("department", { length: 50 }),
  positionLevel: integer("position_level").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  usersPersonnelUnique: unique().on(table.personnelId),
}));

// Refresh Tokens Table - JWT Token Yenileme Sistemi
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull(), // bcrypt hash of refresh token
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => ({
  userIdIdx: index("idx_refresh_tokens_user_id").on(table.userId),
  expiresAtIdx: index("idx_refresh_tokens_expires_at").on(table.expiresAt),
  tokenHashIdx: index("idx_refresh_tokens_hash").on(table.tokenHash),
}));

// ========================
// ADVANCED SECURITY TABLES
// ========================

// Login Attempts - Brute Force Protection
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 150 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  success: boolean("success").notNull().default(false),
  attemptTime: timestamp("attempt_time").notNull().defaultNow(),
  failureReason: varchar("failure_reason", { length: 50 }), // 'invalid_password', 'user_not_found', 'account_locked'
}, (table) => ({
  emailIdx: index("idx_login_attempts_email").on(table.email),
  ipIdx: index("idx_login_attempts_ip").on(table.ipAddress),
  timeIdx: index("idx_login_attempts_time").on(table.attemptTime),
}));

// Account Security Settings
export const userSecuritySettings = pgTable("user_security_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),

  isAccountLocked: boolean("is_account_locked").notNull().default(false),
  lockReason: varchar("lock_reason", { length: 100 }),
  lockedAt: timestamp("locked_at"),
  lockedUntil: timestamp("locked_until"),
  passwordChangedAt: timestamp("password_changed_at").defaultNow(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifyToken: text("email_verify_token"),
  emailVerifyExpires: timestamp("email_verify_expires"),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(5),
  requirePasswordChange: boolean("require_password_change").notNull().default(false),
  lastPasswordCheck: timestamp("last_password_check"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Device Fingerprinting - Cihaz Tanıma
export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceFingerprint: text("device_fingerprint").notNull(), // Device hash
  deviceName: varchar("device_name", { length: 100 }),
  deviceType: varchar("device_type", { length: 20 }), // 'desktop', 'mobile', 'tablet'
  browserInfo: text("browser_info"),
  osInfo: varchar("os_info", { length: 100 }),
  screenResolution: varchar("screen_resolution", { length: 20 }),
  timezone: varchar("timezone", { length: 50 }),
  language: varchar("language", { length: 10 }),
  isVerified: boolean("is_verified").notNull().default(false),
  isTrusted: boolean("is_trusted").notNull().default(false),
  firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  timesUsed: integer("times_used").default(1),
}, (table) => ({
  userIdIdx: index("idx_user_devices_user_id").on(table.userId),
  fingerprintIdx: index("idx_user_devices_fingerprint").on(table.deviceFingerprint),
  uniqueUserDevice: unique("unique_user_device").on(table.userId, table.deviceFingerprint),
}));

// Security Events - Güvenlik Olayları
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'login', 'failed_login', 'password_change', 'suspicious_activity', 'account_locked', '2fa_enabled'
  severity: varchar("severity", { length: 10 }).notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
  description: text("description").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  location: text("location"), // Country/City info from IP
  metadata: text("metadata"), // JSON format for additional data
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("idx_security_events_user").on(table.userId),
  typeIdx: index("idx_security_events_type").on(table.eventType),
  severityIdx: index("idx_security_events_severity").on(table.severity),
  timeIdx: index("idx_security_events_time").on(table.createdAt),
  ipIdx: index("idx_security_events_ip").on(table.ipAddress),
}));

// Rate Limiting - API/Login Rate Limits
export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 100 }).notNull(), // IP address or user ID
  bucketType: varchar("bucket_type", { length: 20 }).notNull(), // 'login', 'api', 'password_reset'
  requestCount: integer("request_count").notNull().default(0),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  windowEnd: timestamp("window_end").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedUntil: timestamp("blocked_until"),
}, (table) => ({
  identifierBucketIdx: index("idx_rate_limit_identifier_bucket").on(table.identifier, table.bucketType),
  windowIdx: index("idx_rate_limit_window").on(table.windowEnd),
  uniqueIdentifierBucket: unique("unique_identifier_bucket").on(table.identifier, table.bucketType),
}));

// Password History - Parola Geçmişi
export const passwordHistory = pgTable("password_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("idx_password_history_user").on(table.userId),
  timeIdx: index("idx_password_history_time").on(table.createdAt),
}));

// Şifre Sıfırlama Token'ları
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tokenHashIdx: index("idx_password_reset_token_hash").on(table.tokenHash),
  userIdIdx: index("idx_password_reset_user_id").on(table.userId),
  expiresAtIdx: index("idx_password_reset_expires_at").on(table.expiresAt),
}));

// Hiyerarşik Erişim Seviyeleri Tablosu
export const accessLevels = pgTable("access_levels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  hierarchyLevel: integer("hierarchy_level").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Kullanıcı Erişim Hakları Tablosu
export const userAccessRights = pgTable("user_access_rights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accessLevelId: integer("access_level_id").notNull().references(() => accessLevels.id),
  accessScope: text("access_scope"), // JSON format for flexible access scope
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const userRoles = pgTable("user_roles", {
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => roles.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const apiClients = pgTable("api_clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => apiClients.id),
  keyHash: text("key_hash").notNull(), // Hashed API key
  key: text("key"), // Plain text key (can be null)
  permissions: text("permissions").array(), // Array of permissions
  allowedDomains: text("allowed_domains").array().notNull(), // Domain restrictions
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => apiClients.id),
  userId: integer("user_id").references(() => users.id),
  token: text("token").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => ({
  expireIdx: index("IDX_session_expire").on(table.expire),
}));

// ========================
// AUDIT TRAIL SYSTEM
// ========================

// Merkezi audit log tablosu - Tüm veritabanı değişikliklerini izler
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 64 }).notNull(),
  recordId: integer("record_id").notNull(),
  operation: varchar("operation", { length: 10 }).notNull(), // INSERT, UPDATE, DELETE
  oldValues: text("old_values"), // JSON format
  newValues: text("new_values"), // JSON format
  changedFields: text("changed_fields").array(), // Array of field names
  userId: integer("user_id").references(() => users.id),
  apiClientId: integer("api_client_id").references(() => apiClients.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
  tableRecordIdx: index("idx_audit_table_record").on(table.tableName, table.recordId),
  userIdx: index("idx_audit_user").on(table.userId),
  timestampIdx: index("idx_audit_timestamp").on(table.timestamp),
}));

// Temel audit alanları için ortak fonksiyon - diğer tablolara eklenecek
// Bu alanlar şu şekilde kullanılacak:
// createdBy: integer("created_by").references(() => users.id)
// updatedBy: integer("updated_by").references(() => users.id)  
// createdAt: timestamp("created_at").notNull().defaultNow()
// updatedAt: timestamp("updated_at").notNull().defaultNow()

// ========================
// API Management Tables
// ========================

export const apiEndpoints = pgTable("api_endpoints", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull().unique(),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, PUT, DELETE
  description: text("description"),
  requiredPermissions: text("required_permissions").array(), // JSON array of permission names
  rateLimit: integer("rate_limit").default(100), // requests per minute
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiRequestLogs = pgTable("api_request_logs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => apiClients.id),
  apiKeyId: integer("api_key_id").references(() => apiKeys.id),
  userId: integer("user_id").references(() => users.id),
  endpointId: integer("endpoint_id").references(() => apiEndpoints.id),
  method: varchar("method", { length: 10 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestBody: text("request_body"),
  responseStatus: integer("response_status"),
  responseTime: integer("response_time"), // milliseconds
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
  timestampIdx: index("idx_api_logs_timestamp").on(table.timestamp),
  clientEndpointIdx: index("idx_api_logs_client_endpoint").on(table.clientId, table.endpointId),
}));

export const apiClientPermissions = pgTable("api_client_permissions", {
  clientId: integer("client_id").notNull().references(() => apiClients.id),
  permissionId: integer("permission_id").notNull().references(() => permissions.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  grantedBy: integer("granted_by").references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.clientId, table.permissionId] }),
}));

export const apiRateLimit = pgTable("api_rate_limit", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => apiClients.id),
  endpointId: integer("endpoint_id").references(() => apiEndpoints.id),
  requestCount: integer("request_count").notNull().default(0),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  windowEnd: timestamp("window_end").notNull(),
}, (table) => ({
  clientEndpointIdx: index("idx_api_rate_limit_client_endpoint").on(table.clientId, table.endpointId),
  windowIdx: index("idx_api_rate_limit_window").on(table.windowStart, table.windowEnd),
}));

// ========================
// API Analytics & Usage Tracking
// ========================

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: serial("id").primaryKey(),
  apiClientId: integer("api_client_id").references(() => apiClients.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  requestSizeBytes: integer("request_size_bytes").default(0),
  responseSizeBytes: integer("response_size_bytes").default(0),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  requestTimestamp: timestamp("request_timestamp").notNull().defaultNow(),
  errorMessage: text("error_message"),
  requestBodyHash: varchar("request_body_hash", { length: 64 }),
}, (table) => ({
  clientIdx: index("idx_api_usage_client_id").on(table.apiClientId),
  endpointIdx: index("idx_api_usage_endpoint").on(table.endpoint),
  timestampIdx: index("idx_api_usage_timestamp").on(table.requestTimestamp),
  statusIdx: index("idx_api_usage_status").on(table.statusCode),
}));

export const apiUsageStats = pgTable("api_usage_stats", {
  id: serial("id").primaryKey(),
  apiClientId: integer("api_client_id").notNull().references(() => apiClients.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  usageDate: date("usage_date").notNull(),
  totalRequests: integer("total_requests").default(0),
  successRequests: integer("success_requests").default(0),
  errorRequests: integer("error_requests").default(0),
  avgResponseTimeMs: decimal("avg_response_time_ms", { precision: 8, scale: 2 }).default("0"),
  minResponseTimeMs: integer("min_response_time_ms").default(0),
  maxResponseTimeMs: integer("max_response_time_ms").default(0),
  totalDataTransferredBytes: bigint("total_data_transferred_bytes", { mode: "number" }).default(0),
}, (table) => ({
  uniqueStats: unique("unique_api_stats").on(table.apiClientId, table.endpoint, table.method, table.usageDate),
  clientDateIdx: index("idx_api_stats_client_date").on(table.apiClientId, table.usageDate),
  endpointDateIdx: index("idx_api_stats_endpoint_date").on(table.endpoint, table.usageDate),
}));

// ========================
// Core Business Tables
// ========================

export const personnel = pgTable("personnel", {
  id: serial("id").primaryKey(),
  tcNo: bigint("tc_no", { mode: "bigint" }).unique(),
  name: varchar("name", { length: 50 }).notNull(),
  surname: varchar("surname", { length: 50 }).notNull(),
  birthdate: date("birthdate"),
  nationId: integer("nation_id").references(() => countries.id),
  birthplaceId: integer("birthplace_id").references(() => cities.id),
  address: varchar("address", { length: 255 }),
  phoneNo: varchar("phone_no", { length: 50 }),
  iban: varchar("iban", { length: 34 }),
  status: varchar("status", { length: 20 }),
  companyId: integer("company_id").references(() => companies.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const workAreas = pgTable("work_areas", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").notNull().references(() => cities.id),
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }),
  managerId: integer("manager_id").references(() => personnel.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
});

export const personnelWorkAreas = pgTable("personnel_work_areas", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  workAreaId: integer("work_area_id").notNull().references(() => workAreas.id),
  positionId: integer("position_id").notNull().references(() => personnelPositions.id),
  projectId: integer("project_id").references(() => projects.id),
  subcontractorId: integer("subcontractor_id").references(() => companies.id),
  teamId: integer("team_id").references(() => teams.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  personnelWorkAreaIdx: index("idx_personnel_work_areas_personnel").on(table.personnelId),
  workAreaIdx: index("idx_personnel_work_areas_work_area").on(table.workAreaId),
  projectIdx: index("idx_personnel_work_areas_project").on(table.projectId),
  activeIdx: index("idx_personnel_work_areas_active").on(table.isActive),
  subcontractorIdx: index("idx_personnel_work_areas_subcontractor").on(table.subcontractorId),
  teamIdx: index("idx_personnel_work_areas_team").on(table.teamId),
}));

export const assetsPersonelAssignment = pgTable("assets_personel_assignment", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => carModels.id),
  modelYear: integer("model_year").notNull(),
  plateNumber: varchar("plate_number", { length: 20 }).notNull().unique(),
  chassisNo: varchar("chassis_no", { length: 50 }),
  engineNo: varchar("engine_no", { length: 50 }),
  ownershipTypeId: integer("ownership_type_id").notNull().references(() => ownershipTypes.id),
  ownerCompanyId: integer("owner_company_id").references(() => companies.id),
  registerNo: varchar("register_no", { length: 50 }),
  registerDate: date("register_date"),
  purchaseDate: date("purchase_date"),
  uttsNo: varchar("utts_no", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => personnel.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => personnel.id),
  isActive: boolean("is_active").notNull().default(true),
  
  
});

// Assets Zod schemas
export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});

export const updateAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).partial();

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type UpdateAsset = z.infer<typeof updateAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export const assetDocuments = pgTable("asset_documents", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  personnelId: integer("personnel_id").references(() => personnel.id),
  docTypeId: integer("doc_type_id").notNull().references(() => docSubTypes.id),
  description: varchar("description", { length: 255 }),
  docLink: text("doc_link"),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => personnel.id),
  // Dosya metadata alanları
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }),
  fileHash: varchar("file_hash", { length: 64 }), // SHA256 for duplicate detection
});

export const personnelDocuments = pgTable("personnel_documents", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  docTypeId: integer("doc_type_id").notNull().references(() => docSubTypes.id),
  description: varchar("description", { length: 255 }),
  docLink: text("doc_link"),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => personnel.id),
  // Dosya metadata alanları
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }),
  fileHash: varchar("file_hash", { length: 64 }), // SHA256 for duplicate detection
});

// Trip Rentals Table - Sefer bazlı kiralama
export const tripRentals = pgTable("trip_rentals", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  rentalCompanyId: integer("rental_company_id").notNull().references(() => companies.id),
  driverId: integer("driver_id").references(() => personnel.id),
  tripDate: date("trip_date").notNull(),
  tripStartTime: varchar("trip_start_time", { length: 5 }), // HH:MM format
  tripEndTime: varchar("trip_end_time", { length: 5 }), // HH:MM format
  fromLocation: varchar("from_location", { length: 255 }).notNull(),
  toLocation: varchar("to_location", { length: 255 }).notNull(),
  routeDescription: text("route_description"),
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }),
  pricePerTripCents: integer("price_per_trip_cents").notNull(),
  additionalCostsCents: integer("additional_costs_cents").default(0),
  totalAmountCents: integer("total_amount_cents").notNull(),
  tripStatus: varchar("trip_status", { length: 20 }).notNull().default('planned'), // planned, ongoing, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  assetDateIdx: index("idx_trip_rentals_asset_date").on(table.assetId, table.tripDate),
  companyDateIdx: index("idx_trip_rentals_company_date").on(table.rentalCompanyId, table.tripDate),
  statusIdx: index("idx_trip_rentals_status").on(table.tripStatus),
}));

// Unified Documents Table - Polimorfik yapı
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 20 }).notNull(), // 'personnel', 'asset', 'company', 'work_area', 'operation'
  entityId: integer("entity_id").notNull(),
  docTypeId: integer("doc_type_id").notNull().references(() => docSubTypes.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }),
  fileHash: varchar("file_hash", { length: 64 }), // SHA256 for duplicate detection
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  validityStartDate: date("validity_start_date"),
  validityEndDate: date("validity_end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  entityIdx: index("idx_documents_entity").on(table.entityType, table.entityId),
  fileHashIdx: index("idx_documents_file_hash").on(table.fileHash),
  uploadDateIdx: index("idx_documents_upload_date").on(table.uploadDate),
  entityTypeCheck: check("entity_type_check", sql`entity_type IN ('personnel', 'asset', 'company', 'work_area', 'operation')`),
}));

export const assetsPolicies = pgTable("assets_policies", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  policyTypeId: integer("policy_type_id").notNull().references(() => policyTypes.id),
  sellerCompanyId: integer("seller_company_id").notNull().references(() => companies.id),
  insuranceCompanyId: integer("insurance_company_id").notNull().references(() => companies.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  policyNumber: varchar("policy_number", { length: 100 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  pid: integer("pid"),
}, (table) => ({
  amountCheck: check("amount_cents_check", sql`amount_cents >= 0`),
  policyUnique: unique().on(table.assetId, table.policyNumber),
}));

export const assetsDamageData = pgTable("assets_damage_data", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  personnelId: integer("personnel_id").references(() => personnel.id),
  damageTypeId: integer("damage_type_id").notNull().references(() => damageTypes.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  eventDate: date("event_date").notNull(),
  amountCents: integer("amount_cents").notNull(),
  documents: text("documents"),
  isActive: boolean("is_active").notNull().default(true),
  policyId: integer("policy_id").references(() => assetsPolicies.id),
}, (table) => ({
  amountCheck: check("amount_cents_check", sql`amount_cents >= 0`),
}));

export const assetsMaintenance = pgTable("assets_maintenance", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  maintenanceTypeId: integer("maintenance_type_id").notNull().references(() => maintenanceTypes.id),
  maintenanceDate: date("maintenance_date").notNull(),
  dueByDate: date("due_by_date"),
  kmReading: integer("km_reading"),
  amountCents: integer("amount_cents").notNull(),
  description: text("description"),
  serviceProvider: varchar("service_provider", { length: 100 }),
  warrantyUntil: date("warranty_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => personnel.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => personnel.id),
}, (table) => ({
  assetDateIdx: index("idx_assets_maintenance_asset_date").on(table.assetId, table.maintenanceDate),
  dueByDateIdx: index("idx_assets_maintenance_due_by_date").on(table.dueByDate),
  typeIdx: index("idx_assets_maintenance_type").on(table.maintenanceTypeId),
  amountCheck: check("amount_cents_check", sql`amount_cents >= 0`),
  kmCheck: check("km_reading_check", sql`km_reading >= 0`),
}));

// Yakıt Yönetimi Tablosu - Fuel Records
export const fuelRecords = pgTable("fuel_records", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  recordDate: date("record_date").notNull(),
  currentKilometers: integer("current_kilometers").notNull(),
  fuelAmount: decimal("fuel_amount", { precision: 8, scale: 2 }).notNull(), // litre cinsinden
  fuelCostCents: integer("fuel_cost_cents").notNull(), // kuruş cinsinden
  gasStationName: varchar("gas_station_name", { length: 100 }),
  driverId: integer("driver_id").references(() => personnel.id),
  notes: text("notes"),
  receiptNumber: varchar("receipt_number", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => personnel.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => personnel.id),
}, (table) => ({
  assetDateIdx: index("idx_fuel_records_asset_date").on(table.assetId, table.recordDate),
  kilometersIdx: index("idx_fuel_records_kilometers").on(table.currentKilometers),
  costCheck: check("fuel_cost_cents_check", sql`fuel_cost_cents >= 0`),
  kilometersCheck: check("current_kilometers_check", sql`current_kilometers >= 0`),
  fuelAmountCheck: check("fuel_amount_check", sql`fuel_amount > 0`),
}));

// Fuel Records Zod schemas
export const insertFuelRecordSchema = createInsertSchema(fuelRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  currentKilometers: z.number().int().min(0),
  fuelAmount: z.number().positive(),
  fuelCostCents: z.number().int().min(0),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
});

export const updateFuelRecordSchema = createInsertSchema(fuelRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  currentKilometers: z.number().int().min(0).optional(),
  fuelAmount: z.number().positive().optional(),
  fuelCostCents: z.number().int().min(0).optional(),
  recordDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
}).partial();

export type InsertFuelRecord = z.infer<typeof insertFuelRecordSchema>;
export type UpdateFuelRecord = z.infer<typeof updateFuelRecordSchema>;
export type FuelRecord = typeof fuelRecords.$inferSelect;

// Maintenance Types Zod schemas
export const insertMaintenanceTypeSchema = createInsertSchema(maintenanceTypes).omit({
  id: true,
});

export const updateMaintenanceTypeSchema = createInsertSchema(maintenanceTypes).omit({
  id: true,
}).extend({
  name: z.string().min(1, "Bakım türü adı gereklidir").optional(),
  isActive: z.boolean().optional(),
});

export type MaintenanceTypeSelect = typeof maintenanceTypes.$inferSelect;
export type MaintenanceTypeInsert = z.infer<typeof insertMaintenanceTypeSchema>;
export type MaintenanceTypeUpdate = z.infer<typeof updateMaintenanceTypeSchema>;

// Assets Maintenance Zod schemas
export const insertAssetsMaintenanceSchema = createInsertSchema(assetsMaintenance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  maintenanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  dueByDate: z.string().optional(),
  warrantyUntil: z.string().optional(),
  kmReading: z.number().int().min(0, "Kilometre 0'dan küçük olamaz").optional(),
  amountCents: z.number().int().min(0, "Tutar 0'dan küçük olamaz"),
});

export const updateAssetsMaintenanceSchema = createInsertSchema(assetsMaintenance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  assetId: z.number().int().optional(),
  maintenanceTypeId: z.number().int().optional(),
  maintenanceDate: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Tarih YYYY-MM-DD formatında olmalıdır"),
  dueByDate: z.string().optional(),
  warrantyUntil: z.string().optional(),
  kmReading: z.number().int().min(0, "Kilometre 0'dan küçük olamaz").optional(),
  amountCents: z.number().int().min(0, "Tutar 0'dan küçük olamaz").optional(),
  description: z.string().optional(),
  serviceProvider: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial();

export type AssetsMaintenanceSelect = typeof assetsMaintenance.$inferSelect;
export type AssetsMaintenanceInsert = z.infer<typeof insertAssetsMaintenanceSchema>;
export type AssetsMaintenanceUpdate = z.infer<typeof updateAssetsMaintenanceSchema>;

export const rentalAgreements = pgTable("rental_agreements", {
  id: serial("id").primaryKey(),
  agreementNumber: varchar("agreement_number", { length: 50 }).notNull().unique(),
  rentalCompanyId: integer("rental_company_id").notNull().references(() => companies.id),
  tenantCompanyId: integer("tenant_company_id").notNull().references(() => companies.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isShortTerm: boolean("is_short_term").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

export const rentalAssets = pgTable("rental_assets", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull().references(() => rentalAgreements.id, { onDelete: "cascade" }),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  mountCents: integer("mount_cents").notNull(),
  vatPercent: decimal("vat_percent", { precision: 5, scale: 2 }).notNull(),
  kmMonthLimit: integer("km_month_limit").notNull(),
  kmTotalLimit: integer("km_total_limit").notNull(),
}, (table) => ({
  vatKmIdx: index("idx_rental_assets_vat_kmh").on(table.vatPercent, table.kmMonthLimit),
}));

export const penalties = pgTable("penalties", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  driverId: integer("driver_id").references(() => personnel.id),
  penaltyTypeId: integer("penalty_type_id").notNull().references(() => penaltyTypes.id),
  amountCents: integer("amount_cents").notNull(),
  discountedAmountCents: integer("discounted_amount_cents").notNull(),
  penaltyDate: date("penalty_date").notNull(),
  lastDate: date("last_date"),
  status: varchar("status", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => personnel.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => personnel.id),
});

// Payment Types table
export const paymentTypes = pgTable("payment_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const finCurrentAccounts = pgTable("fin_current_accounts", {
  id: serial("id").primaryKey(),
  isDebit: boolean("is_debit").notNull(),
  description: varchar("description", { length: 255 }),
  payerCompanyId: integer("payer_company_id").notNull().references(() => companies.id),
  payeeCompanyId: integer("payee_company_id").notNull().references(() => companies.id),
  amountCents: integer("amount_cents").notNull(),
  transactionDate: date("transaction_date").notNull(),
  isDone: boolean("is_done").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  paymentStatus: varchar("payment_status", { length: 20 }).default("beklemede"),
  paymentReference: varchar("payment_reference", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const finAccountsDetails = pgTable("fin_accounts_details", {
  id: serial("id").primaryKey(),
  finCurAcId: integer("fin_cur_ac_id").notNull().references(() => finCurrentAccounts.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // kuruş cinsinden
  date: date("date").notNull(),
  paymentTypeId: integer("payment_type_id").notNull().references(() => paymentTypes.id),
  isDone: boolean("is_done").notNull().default(false),
  doneDate: date("done_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========================
// Relations
// ========================

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
  personnel: many(personnel),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, {
    fields: [cities.countryId],
    references: [countries.id],
  }),
  companies: many(companies),
  workAreas: many(workAreas),
  personnel: many(personnel),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  city: one(cities, {
    fields: [companies.cityId],
    references: [cities.id],
  }),
  users: many(users),
  apiClients: many(apiClients),
  assets: many(assets),
  assetsPoliciesAsSeller: many(assetsPolicies, { relationName: "sellerCompany" }),
  assetsPoliciesAsInsurance: many(assetsPolicies, { relationName: "insuranceCompany" }),
  rentalAgreementsAsRental: many(rentalAgreements, { relationName: "rentalCompany" }),
  rentalAgreementsAsTenant: many(rentalAgreements, { relationName: "tenantCompany" }),
  finCurrentAccountsAsPayer: many(finCurrentAccounts, { relationName: "payerCompany" }),
  finCurrentAccountsAsPayee: many(finCurrentAccounts, { relationName: "payeeCompany" }),
  companyTypeMatches: many(companyTypeMatches),
  personnelCompanyMatches: many(personnelCompanyMatches),
}));

export const companyTypesRelations = relations(companyTypes, ({ many }) => ({
  companyTypeMatches: many(companyTypeMatches),
}));

export const companyTypeMatchesRelations = relations(companyTypeMatches, ({ one }) => ({
  company: one(companies, {
    fields: [companyTypeMatches.companyId],
    references: [companies.id],
  }),
  type: one(companyTypes, {
    fields: [companyTypeMatches.typeId],
    references: [companyTypes.id],
  }),
}));

export const personnelCompanyMatchesRelations = relations(personnelCompanyMatches, ({ one }) => ({
  personnel: one(personnel, {
    fields: [personnelCompanyMatches.personnelId],
    references: [personnel.id],
  }),
  company: one(companies, {
    fields: [personnelCompanyMatches.companyId],
    references: [companies.id],
  }),
  position: one(personnelPositions, {
    fields: [personnelCompanyMatches.positionId],
    references: [personnelPositions.id],
  }),
}));

export const carBrandsRelations = relations(carBrands, ({ many }) => ({
  models: many(carModels),
}));

export const carTypesRelations = relations(carTypes, ({ many }) => ({
  models: many(carModels),
}));

export const carModelsRelations = relations(carModels, ({ one, many }) => ({
  brand: one(carBrands, {
    fields: [carModels.brandId],
    references: [carBrands.id],
  }),
  type: one(carTypes, {
    fields: [carModels.typeId],
    references: [carTypes.id],
  }),
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  model: one(carModels, {
    fields: [assets.modelId],
    references: [carModels.id],
  }),
  ownershipType: one(ownershipTypes, {
    fields: [assets.ownershipTypeId],
    references: [ownershipTypes.id],
  }),
  ownerCompany: one(companies, {
    fields: [assets.ownerCompanyId],
    references: [companies.id],
  }),
  createdByPersonnel: one(personnel, {
    fields: [assets.createdBy],
    references: [personnel.id],
    relationName: "assetCreator",
  }),
  updatedByPersonnel: one(personnel, {
    fields: [assets.updatedBy],
    references: [personnel.id],
    relationName: "assetUpdater",
  }),
  documents: many(assetDocuments),
  policies: many(assetsPolicies),
  damageData: many(assetsDamageData),
  maintenance: many(assetsMaintenance),
  rentalAssets: many(rentalAssets),
  penalties: many(penalties),
  teamVehicles: many(teamVehicles),
}));

// Personnel Relations
export const personnelRelations = relations(personnel, ({ one, many }) => ({
  nation: one(countries, {
    fields: [personnel.nationId],
    references: [countries.id],
  }),
  birthplace: one(cities, {
    fields: [personnel.birthplaceId],
    references: [cities.id],
  }),
  company: one(companies, {
    fields: [personnel.companyId],
    references: [companies.id],
  }),
  users: many(users),
  personnelWorkAreas: many(personnelWorkAreas),
  assetsPersonelAssignments: many(assetsPersonelAssignment),
  personnelCompanyMatches: many(personnelCompanyMatches),
  createdAssets: many(assets, { relationName: "assetCreator" }),
  updatedAssets: many(assets, { relationName: "assetUpdater" }),
  assetDocuments: many(assetDocuments),
  personnelDocuments: many(personnelDocuments),
  personnelAccess: many(personnelAccess),
}));

// Access Types Relations
export const accessTypesRelations = relations(accessTypes, ({ many }) => ({
  personnelAccess: many(personnelAccess),
}));

// Personnel Access Relations
export const personnelAccessRelations = relations(personnelAccess, ({ one }) => ({
  personnel: one(personnel, {
    fields: [personnelAccess.personnelId],
    references: [personnel.id],
  }),
  workArea: one(workAreas, {
    fields: [personnelAccess.workareaId],
    references: [workAreas.id],
  }),
  accessType: one(accessTypes, {
    fields: [personnelAccess.typeId],
    references: [accessTypes.id],
  }),
  createdByUser: one(users, {
    fields: [personnelAccess.createdBy],
    references: [users.id],
  }),
}));

// Documents Relations
export const documentsRelations = relations(documents, ({ one }) => ({
  docSubType: one(docSubTypes, {
    fields: [documents.docTypeId],
    references: [docSubTypes.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

// Trip Rentals Relations
export const tripRentalsRelations = relations(tripRentals, ({ one }) => ({
  asset: one(assets, {
    fields: [tripRentals.assetId],
    references: [assets.id],
  }),
  rentalCompany: one(companies, {
    fields: [tripRentals.rentalCompanyId],
    references: [companies.id],
  }),
  driver: one(personnel, {
    fields: [tripRentals.driverId],
    references: [personnel.id],
  }),
  createdByUser: one(users, {
    fields: [tripRentals.createdBy],
    references: [users.id],
    relationName: "tripRentalCreator",
  }),
  updatedByUser: one(users, {
    fields: [tripRentals.updatedBy],
    references: [users.id],
    relationName: "tripRentalUpdater",
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  personnel: one(personnel, {
    fields: [users.personnelId],
    references: [personnel.id],
  }),
  userRoles: many(userRoles),
  apiTokens: many(apiTokens),
  userAccessRights: many(userAccessRights),
}));

export const accessLevelsRelations = relations(accessLevels, ({ many }) => ({
  userAccessRights: many(userAccessRights),
}));

export const userAccessRightsRelations = relations(userAccessRights, ({ one }) => ({
  user: one(users, {
    fields: [userAccessRights.userId],
    references: [users.id],
  }),
  accessLevel: one(accessLevels, {
    fields: [userAccessRights.accessLevelId],
    references: [accessLevels.id],
  }),
  grantedByUser: one(users, {
    fields: [userAccessRights.grantedBy],
    references: [users.id],
    relationName: "grantedBy",
  }),
}));

// Zod schemas for key tables

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  companyId: z.number().optional().default(1)
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
}).extend({
  companyTypeId: z.number().optional() // Şirket oluştururken tip ataması için opsiyonel
});

export const insertCompanyTypeSchema = createInsertSchema(companyTypes).omit({
  id: true,
});

export const insertCompanyTypeMatchSchema = createInsertSchema(companyTypeMatches).omit({
  id: true,
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
});

export const insertCarBrandSchema = createInsertSchema(carBrands).omit({
  id: true,
});

export const insertCarModelSchema = createInsertSchema(carModels).omit({
  id: true,
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({
  id: true,
});

export const insertAssetsPersonelAssignmentSchema = createInsertSchema(assetsPersonelAssignment).omit({
  id: true,
});

export const updateAssetsPersonelAssignmentSchema = createInsertSchema(assetsPersonelAssignment).omit({
  id: true,
}).partial();

export type InsertAssetsPersonelAssignment = z.infer<typeof insertAssetsPersonelAssignmentSchema>;
export type UpdateAssetsPersonelAssignment = z.infer<typeof updateAssetsPersonelAssignmentSchema>;
export type AssetsPersonelAssignment = typeof assetsPersonelAssignment.$inferSelect;

export const insertWorkAreaSchema = createInsertSchema(workAreas).omit({
  id: true,
});

export const updateWorkAreaSchema = insertWorkAreaSchema.partial();

// Ownership Types Schemas
export const insertOwnershipTypeSchema = createInsertSchema(ownershipTypes).omit({
  id: true,
});

export const updateOwnershipTypeSchema = insertOwnershipTypeSchema.partial();

// Personnel Positions Schemas  
export const insertPersonnelPositionSchema = createInsertSchema(personnelPositions).omit({
  id: true,
}).extend({
  name: z.string().min(1, "Pozisyon adı gereklidir").max(50, "Pozisyon adı maksimum 50 karakter olabilir"),
  description: z.string().max(255, "Açıklama maksimum 255 karakter olabilir").optional(),
  isActive: z.boolean().optional(),
});

export const updatePersonnelPositionSchema = insertPersonnelPositionSchema.partial();

// Personnel Work Areas Schemas
export const insertPersonnelWorkAreaSchema = createInsertSchema(personnelWorkAreas).omit({
  id: true,
});

export const updatePersonnelWorkAreaSchema = insertPersonnelWorkAreaSchema.partial();

// Personnel Company Matches Schemas
export const insertPersonnelCompanyMatchSchema = createInsertSchema(personnelCompanyMatches).omit({
  id: true,
});

export const updatePersonnelCompanyMatchSchema = insertPersonnelCompanyMatchSchema.partial();

// Documents Schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  entityType: z.enum(['personnel', 'asset', 'company', 'work_area', 'operation']),
  title: z.string().min(1).max(255),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1),
});

export const updateDocumentSchema = insertDocumentSchema.partial();

// Trip Rentals Schemas
export const insertTripRentalSchema = createInsertSchema(tripRentals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tripDate: z.string(), // YYYY-MM-DD format
  tripStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  tripEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  tripStatus: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('planned'),
  pricePerTripCents: z.number().int().min(0),
  additionalCostsCents: z.number().int().min(0).default(0),
  totalAmountCents: z.number().int().min(0),
  distanceKm: z.string().optional(), // decimal as string
});

export const updateTripRentalSchema = insertTripRentalSchema.partial();

// Rental Agreements Schemas
export const insertRentalAgreementSchema = createInsertSchema(rentalAgreements).omit({
  id: true,
}).extend({
  agreementNumber: z.string().min(1).max(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
});

export const updateRentalAgreementSchema = insertRentalAgreementSchema.partial();

// Rental Assets Schemas
export const insertRentalAssetSchema = createInsertSchema(rentalAssets).omit({
  id: true,
}).extend({
  mountCents: z.number().int().min(0),
  vatPercent: z.string(), // decimal as string
  kmMonthLimit: z.number().int().min(0),
  kmTotalLimit: z.number().int().min(0),
});

export const updateRentalAssetSchema = insertRentalAssetSchema.partial();

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// Company update schema
export const updateCompanySchema = insertCompanySchema.partial();
export type UpdateCompany = z.infer<typeof updateCompanySchema>;

// Company Types
export type CompanyType = typeof companyTypes.$inferSelect;
export type InsertCompanyType = z.infer<typeof insertCompanyTypeSchema>;

// Company Type Matches
export type CompanyTypeMatch = typeof companyTypeMatches.$inferSelect;
export type InsertCompanyTypeMatch = z.infer<typeof insertCompanyTypeMatchSchema>;

export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type CarBrand = typeof carBrands.$inferSelect;
export type InsertCarBrand = z.infer<typeof insertCarBrandSchema>;

export type CarModel = typeof carModels.$inferSelect;
export type InsertCarModel = z.infer<typeof insertCarModelSchema>;

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;

export type WorkArea = typeof workAreas.$inferSelect;
export type InsertWorkArea = z.infer<typeof insertWorkAreaSchema>;
export type UpdateWorkArea = z.infer<typeof updateWorkAreaSchema>;

export type OwnershipType = typeof ownershipTypes.$inferSelect;
export type InsertOwnershipType = z.infer<typeof insertOwnershipTypeSchema>;
export type UpdateOwnershipType = z.infer<typeof updateOwnershipTypeSchema>;

export type PersonnelPosition = typeof personnelPositions.$inferSelect;
export type InsertPersonnelPosition = z.infer<typeof insertPersonnelPositionSchema>;
export type UpdatePersonnelPosition = z.infer<typeof updatePersonnelPositionSchema>;

export type PersonnelWorkArea = typeof personnelWorkAreas.$inferSelect;
export type InsertPersonnelWorkArea = z.infer<typeof insertPersonnelWorkAreaSchema>;
export type UpdatePersonnelWorkArea = z.infer<typeof updatePersonnelWorkAreaSchema>;

// Personnel Company Matches Types
export type PersonnelCompanyMatch = typeof personnelCompanyMatches.$inferSelect;
export type InsertPersonnelCompanyMatch = z.infer<typeof insertPersonnelCompanyMatchSchema>;
export type UpdatePersonnelCompanyMatch = z.infer<typeof updatePersonnelCompanyMatchSchema>;

// Documents Types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;

// Trip Rentals Types
export type TripRental = typeof tripRentals.$inferSelect;
export type InsertTripRental = z.infer<typeof insertTripRentalSchema>;
export type UpdateTripRental = z.infer<typeof updateTripRentalSchema>;

// Rental Agreements Types
export type RentalAgreement = typeof rentalAgreements.$inferSelect;
export type InsertRentalAgreement = z.infer<typeof insertRentalAgreementSchema>;
export type UpdateRentalAgreement = z.infer<typeof updateRentalAgreementSchema>;

// Rental Assets Types
export type RentalAsset = typeof rentalAssets.$inferSelect;
export type InsertRentalAsset = z.infer<typeof insertRentalAssetSchema>;
export type UpdateRentalAsset = z.infer<typeof updateRentalAssetSchema>;

export type PolicyType = typeof policyTypes.$inferSelect;
export type DamageType = typeof damageTypes.$inferSelect;
export type MaintenanceType = typeof maintenanceTypes.$inferSelect;

// Policy Type Schemas
export const insertPolicyTypeSchema = createInsertSchema(policyTypes).omit({
  id: true,
});

export type InsertPolicyType = z.infer<typeof insertPolicyTypeSchema>;

// Stuff Schemas and Types
export const insertStuffSchema = createInsertSchema(stuff).omit({
  id: true,
});

export const updateStuffSchema = createInsertSchema(stuff).omit({
  id: true,
}).partial();

export const insertPersonnelStuffMatcherSchema = createInsertSchema(personnelStuffMatcher).omit({
  id: true,
});

export const updatePersonnelStuffMatcherSchema = createInsertSchema(personnelStuffMatcher).omit({
  id: true,
}).partial();

export type Stuff = typeof stuff.$inferSelect;
export type InsertStuff = z.infer<typeof insertStuffSchema>;
export type UpdateStuff = z.infer<typeof updateStuffSchema>;

export type PersonnelStuffMatcher = typeof personnelStuffMatcher.$inferSelect;
export type InsertPersonnelStuffMatcher = z.infer<typeof insertPersonnelStuffMatcherSchema>;
export type UpdatePersonnelStuffMatcher = z.infer<typeof updatePersonnelStuffMatcherSchema>;


// API Management Schemas and Types
export const insertApiClientSchema = createInsertSchema(apiClients).omit({
  id: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertApiEndpointSchema = createInsertSchema(apiEndpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiTokenSchema = createInsertSchema(apiTokens).omit({
  id: true,
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
});

// API Management Types
export type ApiClient = typeof apiClients.$inferSelect;
export type InsertApiClient = z.infer<typeof insertApiClientSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = z.infer<typeof insertApiEndpointSchema>;

export type ApiToken = typeof apiTokens.$inferSelect;
export type InsertApiToken = z.infer<typeof insertApiTokenSchema>;

// ========================
// Financial Schema Types and Relations  
// ========================

export const finCurrentAccountsRelations = relations(finCurrentAccounts, ({ one, many }) => ({
  payerCompany: one(companies, {
    fields: [finCurrentAccounts.payerCompanyId],
    references: [companies.id],
    relationName: "payerCompany",
  }),
  payeeCompany: one(companies, {
    fields: [finCurrentAccounts.payeeCompanyId],
    references: [companies.id],
    relationName: "payeeCompany",
  }),
  paymentMethod: one(paymentMethods, {
    fields: [finCurrentAccounts.paymentMethodId],
    references: [paymentMethods.id],
  }),
  details: many(finAccountsDetails),
}));

export const finAccountsDetailsRelations = relations(finAccountsDetails, ({ one }) => ({
  finCurrentAccount: one(finCurrentAccounts, {
    fields: [finAccountsDetails.finCurAcId],
    references: [finCurrentAccounts.id],
  }),
  paymentType: one(paymentTypes, {
    fields: [finAccountsDetails.paymentTypeId],
    references: [paymentTypes.id],
  }),
}));

export const paymentTypesRelations = relations(paymentTypes, ({ many }) => ({
  details: many(finAccountsDetails),
}));

// Zod Schemas for Financial Tables
export const insertFinCurrentAccountSchema = createInsertSchema(finCurrentAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFinCurrentAccountSchema = insertFinCurrentAccountSchema.partial();

export const insertFinAccountsDetailSchema = createInsertSchema(finAccountsDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFinAccountsDetailSchema = insertFinAccountsDetailSchema.partial();

export const insertPaymentTypeSchema = createInsertSchema(paymentTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertFinCurrentAccount = z.infer<typeof insertFinCurrentAccountSchema>;
export type UpdateFinCurrentAccount = z.infer<typeof updateFinCurrentAccountSchema>;
export type FinCurrentAccount = typeof finCurrentAccounts.$inferSelect;

export type InsertFinAccountsDetail = z.infer<typeof insertFinAccountsDetailSchema>;
export type UpdateFinAccountsDetail = z.infer<typeof updateFinAccountsDetailSchema>;
export type FinAccountsDetail = typeof finAccountsDetails.$inferSelect;

export type InsertPaymentType = z.infer<typeof insertPaymentTypeSchema>;
export type PaymentType = z.infer<typeof insertPaymentTypeSchema>;
export type PaymentTypeSelect = typeof paymentTypes.$inferSelect;

export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

// Asset Documents types
export type InsertAssetDocument = typeof assetDocuments.$inferInsert;
export type SelectAssetDocument = typeof assetDocuments.$inferSelect;

// Personnel Documents types
export type InsertPersonnelDocument = typeof personnelDocuments.$inferInsert;
export type SelectPersonnelDocument = typeof personnelDocuments.$inferSelect;

// Zod validation schemas for asset documents
export const insertAssetDocumentSchema = createInsertSchema(assetDocuments).omit({
  id: true,
  uploadDate: true,
  createdAt: true,
});

export const insertPersonnelDocumentSchema = createInsertSchema(personnelDocuments).omit({
  id: true,
  uploadDate: true,
  createdAt: true,
});

export const assetDocumentUploadSchema = z.object({
  assetId: z.number().int().positive(),
  docTypeId: z.number().int().positive(),
  personnelId: z.number().int().positive().optional(),
  description: z.string().max(255).optional(),
  fileName: z.string().max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
});

export const personnelDocumentUploadSchema = z.object({
  personnelId: z.number().int().positive(),
  docTypeId: z.number().int().positive(),
  description: z.string().max(255).optional(),
  fileName: z.string().max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
});

// Unified document upload schema - either asset or personnel
export const documentUploadSchema = z.object({
  assetId: z.number().int().positive().optional(),
  personnelId: z.number().int().positive().optional(),
  docTypeId: z.number().int().positive(),
  description: z.string().max(255).optional(),
  fileName: z.string().max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().max(100),
}).refine(data => data.assetId || data.personnelId, {
  message: "Either assetId or personnelId must be provided"
});

// ========================
// Outage Process Management Tables
// ========================

export const projectPyps = pgTable("project_pyps", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  projectIdx: index("idx_project_pyps_project").on(table.projectId),
  statusIdx: index("idx_project_pyps_status").on(table.status),
  uniqueProjectCode: unique("uniq_project_pyps_code").on(table.projectId, table.code),
}));

export const insertProjectPypSchema = createInsertSchema(projectPyps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProjectPypSchema = insertProjectPypSchema.partial();
export type InsertProjectPyp = z.infer<typeof insertProjectPypSchema>;
export type UpdateProjectPyp = z.infer<typeof updateProjectPypSchema>;
export type ProjectPyp = typeof projectPyps.$inferSelect;

export const projectPypsRelations = relations(projectPyps, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectPyps.projectId],
    references: [projects.id],
  }),
  progressPayments: many(progressPayments),
}));

export const foOutageProcess = pgTable("fo_outage_process", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => companies.id),
  processorFirmId: integer("processor_firm_id").notNull().references(() => companies.id),
  causeOfOutage: text("cause_of_outage"),
  rootBuildName: varchar("root_build_name", { length: 255 }),
  rootBuildCode: varchar("root_build_code", { length: 100 }),
  outputStartPoint: varchar("output_start_point", { length: 255 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  startClock: varchar("start_clock", { length: 8 }), // TIME as HH:MM:SS
  endClock: varchar("end_clock", { length: 8 }), // TIME as HH:MM:SS
  areaOfOutage: text("area_of_outage"),
  supervisorId: integer("supervisor_id").references(() => personnel.id),
  processorSupervisor: varchar("processor_supervisor", { length: 255 }),
  workerChefId: integer("worker_chef_id").references(() => personnel.id),
  pypId: integer("pyp_id").references(() => projectPyps.id),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  coordinatX: varchar("coordinat_x"),
  coordinatY: varchar("coordinat_y"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  firmIdx: index("idx_fo_outage_process_firm").on(table.firmId),
  processorFirmIdx: index("idx_fo_outage_process_processor_firm").on(table.processorFirmId),
  pypIdx: index("idx_fo_outage_process_pyp").on(table.pypId),
  datesIdx: index("idx_fo_outage_process_dates").on(table.startDate, table.endDate),
  activeIdx: index("idx_fo_outage_process_active").on(table.isActive),
}));

export const foOutageProcessPersonnels = pgTable("fo_outage_process_personnels", {
  id: serial("id").primaryKey(),
  outageProcessId: integer("outage_process_id").notNull().references(() => foOutageProcess.id, { onDelete: "cascade" }),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
}, (table) => ({
  uniqueOutagePersonnel: unique("unique_outage_personnel").on(table.outageProcessId, table.personnelId),
  outageProcessIdx: index("idx_fo_outage_personnels_process").on(table.outageProcessId),
  personnelIdx: index("idx_fo_outage_personnels_personnel").on(table.personnelId),
}));

export const foOutageProcessAssets = pgTable("fo_outage_process_assets", {
  id: serial("id").primaryKey(),
  outageProcessId: integer("outage_process_id").notNull().references(() => foOutageProcess.id, { onDelete: "cascade" }),
  assetId: integer("asset_id").notNull().references(() => assets.id),
}, (table) => ({
  uniqueOutageAsset: unique("unique_outage_asset").on(table.outageProcessId, table.assetId),
  outageProcessIdx: index("idx_fo_outage_assets_process").on(table.outageProcessId),
  assetIdx: index("idx_fo_outage_assets_asset").on(table.assetId),
}));

// Outage Process Relations
export const foOutageProcessRelations = relations(foOutageProcess, ({ one, many }) => ({
  firm: one(companies, {
    fields: [foOutageProcess.firmId],
    references: [companies.id],
    relationName: "outageProcessFirm",
  }),
  processorFirm: one(companies, {
    fields: [foOutageProcess.processorFirmId],
    references: [companies.id],
    relationName: "outageProcessorFirm",
  }),
  supervisor: one(personnel, {
    fields: [foOutageProcess.supervisorId],
    references: [personnel.id],
    relationName: "outageSupervisor",
  }),
  workerChef: one(personnel, {
    fields: [foOutageProcess.workerChefId],
    references: [personnel.id],
    relationName: "outageWorkerChef",
  }),
  pyp: one(projectPyps, {
    fields: [foOutageProcess.pypId],
    references: [projectPyps.id],
  }),
  createdByUser: one(users, {
    fields: [foOutageProcess.createdBy],
    references: [users.id],
    relationName: "outageProcessCreator",
  }),
  updatedByUser: one(users, {
    fields: [foOutageProcess.updatedBy],
    references: [users.id],
    relationName: "outageProcessUpdater",
  }),
  personnels: many(foOutageProcessPersonnels),
  assets: many(foOutageProcessAssets),
}));

export const foOutageProcessPersonnelsRelations = relations(foOutageProcessPersonnels, ({ one }) => ({
  outageProcess: one(foOutageProcess, {
    fields: [foOutageProcessPersonnels.outageProcessId],
    references: [foOutageProcess.id],
  }),
  personnel: one(personnel, {
    fields: [foOutageProcessPersonnels.personnelId],
    references: [personnel.id],
  }),
}));

export const foOutageProcessAssetsRelations = relations(foOutageProcessAssets, ({ one }) => ({
  outageProcess: one(foOutageProcess, {
    fields: [foOutageProcessAssets.outageProcessId],
    references: [foOutageProcess.id],
  }),
  asset: one(assets, {
    fields: [foOutageProcessAssets.assetId],
    references: [assets.id],
  }),
}));

// Outage Process Zod Schemas
export const insertFoOutageProcessSchema = createInsertSchema(foOutageProcess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
  startClock: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Saat HH:MM:SS formatında olmalıdır").optional(),
  endClock: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Saat HH:MM:SS formatında olmalıdır").optional(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('planned'),
});

export const updateFoOutageProcessSchema = insertFoOutageProcessSchema.partial();

export const insertFoOutageProcessPersonnelSchema = createInsertSchema(foOutageProcessPersonnels).omit({
  id: true,
});

export const insertFoOutageProcessAssetSchema = createInsertSchema(foOutageProcessAssets).omit({
  id: true,
});

// Outage Process Types
export type FoOutageProcess = typeof foOutageProcess.$inferSelect;
export type InsertFoOutageProcess = z.infer<typeof insertFoOutageProcessSchema>;
export type UpdateFoOutageProcess = z.infer<typeof updateFoOutageProcessSchema>;

export type FoOutageProcessPersonnel = typeof foOutageProcessPersonnels.$inferSelect;
export type InsertFoOutageProcessPersonnel = z.infer<typeof insertFoOutageProcessPersonnelSchema>;

export type FoOutageProcessAsset = typeof foOutageProcessAssets.$inferSelect;
export type InsertFoOutageProcessAsset = z.infer<typeof insertFoOutageProcessAssetSchema>;

// ========================
// PROGRESS PAYMENT (HAKEDİŞ) SYSTEM TABLES
// ========================

// 1. Units (Birimler - Ölçü Birimleri)
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  symbol: varchar("symbol", { length: 10 }),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  nameIdx: index("idx_units_name").on(table.name),
  isActiveIdx: index("idx_units_is_active").on(table.isActive),
}));

// 2. Unit Conversions (Birim Çevirim)
export const unitConversions = pgTable("unit_conversions", {
  id: serial("id").primaryKey(),
  fromUnitId: integer("from_unit_id").notNull().references(() => units.id),
  toUnitId: integer("to_unit_id").notNull().references(() => units.id),
  conversionFactor: decimal("conversion_factor", { precision: 10, scale: 4 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniqueUnitConversion: unique("unique_unit_conversion").on(table.fromUnitId, table.toUnitId),
  fromIdx: index("idx_unit_conversions_from").on(table.fromUnitId),
  toIdx: index("idx_unit_conversions_to").on(table.toUnitId),
  checkDifferentUnits: check("check_different_units", sql`from_unit_id != to_unit_id`),
  checkPositiveFactor: check("check_positive_factor", sql`conversion_factor > 0`),
}));

// 3. Material Types (Malzeme Türleri - Hiyerarşik)
export const materialTypes: any = pgTable("material_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  parentTypeId: integer("parent_type_id").references((): any => materialTypes.id),
  hierarchyLevel: integer("hierarchy_level").notNull().default(0),
  fullPath: varchar("full_path", { length: 500 }),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  parentIdx: index("idx_material_types_parent").on(table.parentTypeId),
  levelIdx: index("idx_material_types_level").on(table.hierarchyLevel),
  nameIdx: index("idx_material_types_name").on(table.name),
  activeIdx: index("idx_material_types_active").on(table.isActive),
}));

// 4. Materials (Malzemeler)
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  typeId: integer("type_id").references(() => materialTypes.id),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  codeIdx: index("idx_materials_code").on(table.code),
  typeIdx: index("idx_materials_type").on(table.typeId),
  nameIdx: index("idx_materials_name").on(table.name),
  activeIdx: index("idx_materials_active").on(table.isActive),
}));

// 5. Material Code Mappings (Malzeme Kod Eşleştirme - Firma Bazlı)
export const materialCodeMappings = pgTable("material_code_mappings", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  companyMaterialCode: varchar("company_material_code", { length: 100 }).notNull(),
  companyMaterialName: varchar("company_material_name", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniqueMaterialCompanyMapping: unique("unique_material_company_mapping").on(table.materialId, table.companyId),
  materialIdx: index("idx_material_mappings_material").on(table.materialId),
  companyIdx: index("idx_material_mappings_company").on(table.companyId),
  codeIdx: index("idx_material_mappings_code").on(table.companyMaterialCode),
}));

// 5b. Material Units (Malzeme-Birim Eşleştirme)
export const materialUnits = pgTable("material_units", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  unitId: integer("unit_id").notNull().references(() => units.id, { onDelete: "restrict" }),
  isPrimary: boolean("is_primary").notNull().default(false),
  conversionNote: text("conversion_note"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniqueMaterialUnit: unique("unique_material_unit").on(table.materialId, table.unitId),
  materialIdx: index("idx_material_units_material").on(table.materialId),
  unitIdx: index("idx_material_units_unit").on(table.unitId),
  activeIdx: index("idx_material_units_active").on(table.isActive),
  primaryIdx: index("idx_material_units_primary").on(table.materialId, table.isPrimary),
}));

// 6. Teams (Ekipler)
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  supervisorId: integer("supervisor_id").references(() => personnel.id),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  companyIdx: index("idx_teams_company").on(table.companyId),
  supervisorIdx: index("idx_teams_supervisor").on(table.supervisorId),
  nameIdx: index("idx_teams_name").on(table.name),
  activeIdx: index("idx_teams_active").on(table.isActive),
}));

// 7. Team Members (Ekip Üyeleri)
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  teamIdx: index("idx_team_members_team").on(table.teamId),
  personnelIdx: index("idx_team_members_personnel").on(table.personnelId),
  datesIdx: index("idx_team_members_dates").on(table.startDate, table.endDate),
  checkMemberDates: check("check_member_dates", sql`end_date IS NULL OR end_date >= start_date`),
}));

// Note: Partial unique index with WHERE clause is not supported in Drizzle ORM
// Unique active team members constraint will be enforced in application logic

export const teamVehicles = pgTable("team_vehicles", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  teamIdx: index("idx_team_vehicles_team").on(table.teamId),
  assetIdx: index("idx_team_vehicles_asset").on(table.assetId),
  datesIdx: index("idx_team_vehicles_dates").on(table.startDate, table.endDate),
  checkVehicleDates: check("check_vehicle_dates", sql`end_date IS NULL OR end_date >= start_date`),
}));

// 8. Unit Prices (Birim Fiyatlar - Tarihsel)
export const unitPrices = pgTable("unit_prices", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  priceCents: integer("price_cents").notNull(),
  validFrom: date("valid_from").notNull(),
  validUntil: date("valid_until"),
  currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  materialIdx: index("idx_unit_prices_material").on(table.materialId),
  unitIdx: index("idx_unit_prices_unit").on(table.unitId),
  projectIdx: index("idx_unit_prices_project").on(table.projectId),
  companyIdx: index("idx_unit_prices_company").on(table.companyId),
  validityIdx: index("idx_unit_prices_validity").on(table.validFrom, table.validUntil),
  activeIdx: index("idx_unit_prices_active").on(table.projectId, table.isActive),
  checkPricePositive: check("check_price_positive", sql`price_cents >= 0`),
  checkValidityDates: check("check_validity_dates", sql`valid_until IS NULL OR valid_until >= valid_from`),
}));

// 9. Progress Payment Types (Hakediş Türleri)
export const progressPaymentTypes = pgTable("progress_payment_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  nameIdx: index("idx_payment_types_name").on(table.name),
}));

// 10. Progress Payments (Hakediş Ana Kayıtları)
export const progressPayments = pgTable("progress_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  paymentDate: date("payment_date").notNull(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  pypId: integer("pyp_id").references(() => projectPyps.id),
  paymentTypeId: integer("payment_type_id").notNull().references(() => progressPaymentTypes.id),
  totalAmountCents: integer("total_amount_cents").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  notes: text("notes"),
  
  // Onay süreci alanları (gelecek için hazır)
  submittedAt: timestamp("submitted_at"),
  submittedBy: integer("submitted_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  paymentDateActual: date("payment_date_actual"),
  
  // Hakediş Hiyerarşisi (YENİ - nullable alanlar, mevcut veriyi etkilemez)
  parentPaymentId: integer("parent_payment_id"),
  // Günlük → Ara, Ara → Kesin ilişkisi (self-reference schema'da tanımlanamaz, migration'da FK eklenir)

  // Revizyon takibi
  revisionNumber: integer("revision_number").notNull().default(0),
  previousRevisionId: integer("previous_revision_id"),
  revisionReason: text("revision_reason"),

  // Kurumsal onay (iç onaydan ayrı)
  institutionalStatus: varchar("institutional_status", { length: 20 }),
  // null, submitted, approved, rejected, revision_requested
  institutionalSubmittedAt: timestamp("institutional_submitted_at"),
  institutionalSubmittedBy: integer("institutional_submitted_by").references(() => users.id),
  institutionalApprovedAt: timestamp("institutional_approved_at"),
  institutionalApprovedBy: integer("institutional_approved_by").references(() => users.id),
  institutionalRejectionReason: text("institutional_rejection_reason"),

  // Birleştirme bilgisi
  isMerged: boolean("is_merged").notNull().default(false),
  mergedIntoId: integer("merged_into_id"),
  mergedAt: timestamp("merged_at"),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniquePaymentNumber: unique("idx_progress_payments_number").on(table.paymentNumber),
  teamDateIdx: index("idx_progress_payments_team_date").on(table.teamId, table.paymentDate),
  projectDateIdx: index("idx_progress_payments_project_date").on(table.projectId, table.paymentDate),
  statusIdx: index("idx_progress_payments_status").on(table.status),
  dateIdx: index("idx_progress_payments_date").on(table.paymentDate),
  activeIdx: index("idx_progress_payments_active").on(table.isActive),
  parentIdx: index("idx_progress_payments_parent").on(table.parentPaymentId),
  mergedIdx: index("idx_progress_payments_merged").on(table.mergedIntoId),
  checkTotalAmount: check("check_total_amount", sql`total_amount_cents >= 0`),
  checkStatusValue: check("check_status_value", sql`status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')`),
}));

// 11. Progress Payment Details (Hakediş Detayları)
export const progressPaymentDetails = pgTable("progress_payment_details", {
  id: serial("id").primaryKey(),
  progressPaymentId: integer("progress_payment_id").notNull().references(() => progressPayments.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  paymentIdx: index("idx_payment_details_payment").on(table.progressPaymentId),
  materialIdx: index("idx_payment_details_material").on(table.materialId),
  unitIdx: index("idx_payment_details_unit").on(table.unitId),
  uniquePaymentMaterial: unique("unique_payment_material").on(table.progressPaymentId, table.materialId),
  checkQuantityPositive: check("check_quantity_positive", sql`quantity > 0`),
  checkUnitPrice: check("check_unit_price", sql`unit_price_cents >= 0`),
  checkLineTotal: check("check_line_total", sql`line_total_cents >= 0`),
}));

// ========================
// PROGRESS PAYMENT RELATIONS
// ========================

export const unitsRelations = relations(units, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [units.createdBy],
    references: [users.id],
    relationName: "unitCreator",
  }),
  updatedByUser: one(users, {
    fields: [units.updatedBy],
    references: [users.id],
    relationName: "unitUpdater",
  }),
  unitConversionsFrom: many(unitConversions, { relationName: "fromUnit" }),
  unitConversionsTo: many(unitConversions, { relationName: "toUnit" }),
  materialUnits: many(materialUnits),
  unitPrices: many(unitPrices),
  progressPaymentDetails: many(progressPaymentDetails),
}));

export const materialUnitsRelations = relations(materialUnits, ({ one }) => ({
  material: one(materials, {
    fields: [materialUnits.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [materialUnits.unitId],
    references: [units.id],
  }),
  createdByUser: one(users, {
    fields: [materialUnits.createdBy],
    references: [users.id],
    relationName: "materialUnitCreator",
  }),
  updatedByUser: one(users, {
    fields: [materialUnits.updatedBy],
    references: [users.id],
    relationName: "materialUnitUpdater",
  }),
}));

export const unitConversionsRelations = relations(unitConversions, ({ one }) => ({
  fromUnit: one(units, {
    fields: [unitConversions.fromUnitId],
    references: [units.id],
    relationName: "fromUnit",
  }),
  toUnit: one(units, {
    fields: [unitConversions.toUnitId],
    references: [units.id],
    relationName: "toUnit",
  }),
  createdByUser: one(users, {
    fields: [unitConversions.createdBy],
    references: [users.id],
    relationName: "unitConversionCreator",
  }),
  updatedByUser: one(users, {
    fields: [unitConversions.updatedBy],
    references: [users.id],
    relationName: "unitConversionUpdater",
  }),
}));

export const materialTypesRelations = relations(materialTypes, ({ one, many }) => ({
  parentType: one(materialTypes, {
    fields: [materialTypes.parentTypeId],
    references: [materialTypes.id],
    relationName: "materialTypeHierarchy",
  }),
  childTypes: many(materialTypes, { relationName: "materialTypeHierarchy" }),
  materials: many(materials),
  createdByUser: one(users, {
    fields: [materialTypes.createdBy],
    references: [users.id],
    relationName: "materialTypeCreator",
  }),
  updatedByUser: one(users, {
    fields: [materialTypes.updatedBy],
    references: [users.id],
    relationName: "materialTypeUpdater",
  }),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  type: one(materialTypes, {
    fields: [materials.typeId],
    references: [materialTypes.id],
  }),
  materialCodeMappings: many(materialCodeMappings),
  materialUnits: many(materialUnits),
  unitPrices: many(unitPrices),
  progressPaymentDetails: many(progressPaymentDetails),
  createdByUser: one(users, {
    fields: [materials.createdBy],
    references: [users.id],
    relationName: "materialCreator",
  }),
  updatedByUser: one(users, {
    fields: [materials.updatedBy],
    references: [users.id],
    relationName: "materialUpdater",
  }),
}));

export const materialCodeMappingsRelations = relations(materialCodeMappings, ({ one }) => ({
  material: one(materials, {
    fields: [materialCodeMappings.materialId],
    references: [materials.id],
  }),
  company: one(companies, {
    fields: [materialCodeMappings.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [materialCodeMappings.createdBy],
    references: [users.id],
    relationName: "materialCodeMappingCreator",
  }),
  updatedByUser: one(users, {
    fields: [materialCodeMappings.updatedBy],
    references: [users.id],
    relationName: "materialCodeMappingUpdater",
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  company: one(companies, {
    fields: [teams.companyId],
    references: [companies.id],
  }),
  supervisor: one(personnel, {
    fields: [teams.supervisorId],
    references: [personnel.id],
  }),
  teamMembers: many(teamMembers),
  teamVehicles: many(teamVehicles),
  progressPayments: many(progressPayments),
  createdByUser: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
    relationName: "teamCreator",
  }),
  updatedByUser: one(users, {
    fields: [teams.updatedBy],
    references: [users.id],
    relationName: "teamUpdater",
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  personnel: one(personnel, {
    fields: [teamMembers.personnelId],
    references: [personnel.id],
  }),
  createdByUser: one(users, {
    fields: [teamMembers.createdBy],
    references: [users.id],
    relationName: "teamMemberCreator",
  }),
  updatedByUser: one(users, {
    fields: [teamMembers.updatedBy],
    references: [users.id],
    relationName: "teamMemberUpdater",
  }),
}));

export const teamVehiclesRelations = relations(teamVehicles, ({ one }) => ({
  team: one(teams, {
    fields: [teamVehicles.teamId],
    references: [teams.id],
  }),
  asset: one(assets, {
    fields: [teamVehicles.assetId],
    references: [assets.id],
  }),
  createdByUser: one(users, {
    fields: [teamVehicles.createdBy],
    references: [users.id],
    relationName: "teamVehicleCreator",
  }),
  updatedByUser: one(users, {
    fields: [teamVehicles.updatedBy],
    references: [users.id],
    relationName: "teamVehicleUpdater",
  }),
}));

export const unitPricesRelations = relations(unitPrices, ({ one }) => ({
  material: one(materials, {
    fields: [unitPrices.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [unitPrices.unitId],
    references: [units.id],
  }),
  project: one(projects, {
    fields: [unitPrices.projectId],
    references: [projects.id],
  }),
  company: one(companies, {
    fields: [unitPrices.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [unitPrices.createdBy],
    references: [users.id],
    relationName: "unitPriceCreator",
  }),
  updatedByUser: one(users, {
    fields: [unitPrices.updatedBy],
    references: [users.id],
    relationName: "unitPriceUpdater",
  }),
}));

export const progressPaymentTypesRelations = relations(progressPaymentTypes, ({ one, many }) => ({
  progressPayments: many(progressPayments),
  createdByUser: one(users, {
    fields: [progressPaymentTypes.createdBy],
    references: [users.id],
    relationName: "progressPaymentTypeCreator",
  }),
  updatedByUser: one(users, {
    fields: [progressPaymentTypes.updatedBy],
    references: [users.id],
    relationName: "progressPaymentTypeUpdater",
  }),
}));

export const progressPaymentsRelations = relations(progressPayments, ({ one, many }) => ({
  team: one(teams, {
    fields: [progressPayments.teamId],
    references: [teams.id],
  }),
  project: one(projects, {
    fields: [progressPayments.projectId],
    references: [projects.id],
  }),
  pyp: one(projectPyps, {
    fields: [progressPayments.pypId],
    references: [projectPyps.id],
  }),
  paymentType: one(progressPaymentTypes, {
    fields: [progressPayments.paymentTypeId],
    references: [progressPaymentTypes.id],
  }),
  details: many(progressPaymentDetails),
  createdByUser: one(users, {
    fields: [progressPayments.createdBy],
    references: [users.id],
    relationName: "progressPaymentCreator",
  }),
  updatedByUser: one(users, {
    fields: [progressPayments.updatedBy],
    references: [users.id],
    relationName: "progressPaymentUpdater",
  }),
  submittedByUser: one(users, {
    fields: [progressPayments.submittedBy],
    references: [users.id],
    relationName: "progressPaymentSubmitter",
  }),
  approvedByUser: one(users, {
    fields: [progressPayments.approvedBy],
    references: [users.id],
    relationName: "progressPaymentApprover",
  }),
}));

export const progressPaymentDetailsRelations = relations(progressPaymentDetails, ({ one }) => ({
  progressPayment: one(progressPayments, {
    fields: [progressPaymentDetails.progressPaymentId],
    references: [progressPayments.id],
  }),
  material: one(materials, {
    fields: [progressPaymentDetails.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [progressPaymentDetails.unitId],
    references: [units.id],
  }),
  createdByUser: one(users, {
    fields: [progressPaymentDetails.createdBy],
    references: [users.id],
    relationName: "progressPaymentDetailCreator",
  }),
  updatedByUser: one(users, {
    fields: [progressPaymentDetails.updatedBy],
    references: [users.id],
    relationName: "progressPaymentDetailUpdater",
  }),
}));

// ========================
// PROGRESS PAYMENT ZOD SCHEMAS
// ========================

// Units Schemas
export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateUnitSchema = insertUnitSchema.partial();
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type UpdateUnit = z.infer<typeof updateUnitSchema>;

// Unit Conversions Schemas
export const insertUnitConversionSchema = createInsertSchema(unitConversions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  conversionFactor: z.string().refine((val) => parseFloat(val) > 0, "Katsayı pozitif olmalıdır"),
});
export const updateUnitConversionSchema = insertUnitConversionSchema.partial();
export type UnitConversion = typeof unitConversions.$inferSelect;
export type InsertUnitConversion = z.infer<typeof insertUnitConversionSchema>;
export type UpdateUnitConversion = z.infer<typeof updateUnitConversionSchema>;

// Material Types Schemas
export const insertMaterialTypeSchema = createInsertSchema(materialTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});
export const updateMaterialTypeSchema = insertMaterialTypeSchema.partial();
export type MaterialType = typeof materialTypes.$inferSelect;
export type InsertMaterialType = z.infer<typeof insertMaterialTypeSchema>;
export type UpdateMaterialType = z.infer<typeof updateMaterialTypeSchema>;

// Materials Schemas
export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});
export const updateMaterialSchema = insertMaterialSchema.partial();
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type UpdateMaterial = z.infer<typeof updateMaterialSchema>;

// Material Code Mappings Schemas
export const insertMaterialCodeMappingSchema = createInsertSchema(materialCodeMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMaterialCodeMappingSchema = insertMaterialCodeMappingSchema.partial();
export type MaterialCodeMapping = typeof materialCodeMappings.$inferSelect;
export type InsertMaterialCodeMapping = z.infer<typeof insertMaterialCodeMappingSchema>;
export type UpdateMaterialCodeMapping = z.infer<typeof updateMaterialCodeMappingSchema>;

// Material Units Schemas
export const insertMaterialUnitSchema = createInsertSchema(materialUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateMaterialUnitSchema = insertMaterialUnitSchema.partial();
export type MaterialUnit = typeof materialUnits.$inferSelect;
export type InsertMaterialUnit = z.infer<typeof insertMaterialUnitSchema>;
export type UpdateMaterialUnit = z.infer<typeof updateMaterialUnitSchema>;

// Teams Schemas
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateTeamSchema = insertTeamSchema.partial();
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;

// Team Members Schemas
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
});
export const updateTeamMemberSchema = insertTeamMemberSchema.partial();
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type UpdateTeamMember = z.infer<typeof updateTeamMemberSchema>;

// Team Vehicles Schemas
export const insertTeamVehicleSchema = createInsertSchema(teamVehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
});
export const updateTeamVehicleSchema = insertTeamVehicleSchema.partial();
export type TeamVehicle = typeof teamVehicles.$inferSelect;
export type InsertTeamVehicle = z.infer<typeof insertTeamVehicleSchema>;
export type UpdateTeamVehicle = z.infer<typeof updateTeamVehicleSchema>;

// Unit Prices Schemas
export const insertUnitPriceSchema = createInsertSchema(unitPrices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
  priceCents: z.number().int().min(0, "Fiyat negatif olamaz"),
});
export const updateUnitPriceSchema = insertUnitPriceSchema.partial();
export type UnitPrice = typeof unitPrices.$inferSelect;
export type InsertUnitPrice = z.infer<typeof insertUnitPriceSchema>;
export type UpdateUnitPrice = z.infer<typeof updateUnitPriceSchema>;

// Progress Payment Types Schemas
export const insertProgressPaymentTypeSchema = createInsertSchema(progressPaymentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateProgressPaymentTypeSchema = insertProgressPaymentTypeSchema.partial();
export type ProgressPaymentType = typeof progressPaymentTypes.$inferSelect;
export type InsertProgressPaymentType = z.infer<typeof insertProgressPaymentTypeSchema>;
export type UpdateProgressPaymentType = z.infer<typeof updateProgressPaymentTypeSchema>;

// Progress Payments Schemas
export const insertProgressPaymentSchema = createInsertSchema(progressPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır"),
  paymentDateActual: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalıdır").optional(),
  totalAmountCents: z.number().int().min(0, "Toplam tutar negatif olamaz").optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'paid']).default('draft'),
});
export const updateProgressPaymentSchema = insertProgressPaymentSchema.partial();
export type ProgressPayment = typeof progressPayments.$inferSelect;
export type InsertProgressPayment = z.infer<typeof insertProgressPaymentSchema>;
export type UpdateProgressPayment = z.infer<typeof updateProgressPaymentSchema>;

// Progress Payment Details Schemas
export const insertProgressPaymentDetailSchema = createInsertSchema(progressPaymentDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  progressPaymentId: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  quantity: z.string().refine((val) => parseFloat(val) > 0, "Miktar pozitif olmalıdır"),
  unitPriceCents: z.number().int().min(0, "Birim fiyat negatif olamaz"),
  lineTotalCents: z.number().int().min(0, "Satır toplamı negatif olamaz"),
});
export const updateProgressPaymentDetailSchema = insertProgressPaymentDetailSchema.partial();
export type ProgressPaymentDetail = typeof progressPaymentDetails.$inferSelect;
export type InsertProgressPaymentDetail = z.infer<typeof insertProgressPaymentDetailSchema>;
export type UpdateProgressPaymentDetail = z.infer<typeof updateProgressPaymentDetailSchema>;

// ========================
// STOK YÖNETİM SİSTEMİ
// ========================

// 1. Depolar (Warehouses) - Şantiyeye bağlı
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  workAreaId: integer("work_area_id").notNull().references(() => workAreas.id),
  managerId: integer("manager_id").references(() => personnel.id),
  warehouseType: varchar("warehouse_type", { length: 20 }).notNull().default("ana_depo"), // ana_depo, saha_depo, gecici_depo
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  codeIdx: index("idx_warehouses_code").on(table.code),
  workAreaIdx: index("idx_warehouses_work_area").on(table.workAreaId),
  typeIdx: index("idx_warehouses_type").on(table.warehouseType),
  activeIdx: index("idx_warehouses_active").on(table.isActive),
}));

// 2. Stok Seviyeleri (Stock Levels) - Depo bazlı anlık stok
export const stockLevels = pgTable("stock_levels", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  currentQuantity: decimal("current_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  reservedQuantity: decimal("reserved_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  minQuantity: decimal("min_quantity", { precision: 15, scale: 4 }),
  lastMovementDate: timestamp("last_movement_date"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniqueStock: unique("unique_warehouse_material_unit").on(table.warehouseId, table.materialId, table.unitId),
  warehouseIdx: index("idx_stock_levels_warehouse").on(table.warehouseId),
  materialIdx: index("idx_stock_levels_material").on(table.materialId),
  unitIdx: index("idx_stock_levels_unit").on(table.unitId),
  checkCurrentQty: check("check_current_qty_non_negative", sql`current_quantity >= 0`),
  checkReservedQty: check("check_reserved_qty_non_negative", sql`reserved_quantity >= 0`),
  checkReservedLessOrEqual: check("check_reserved_lte_current", sql`reserved_quantity <= current_quantity`),
}));

// 3. Proje Bazlı Stok Rezervasyonu (Stock Reservations)
export const stockReservations = pgTable("stock_reservations", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  reservedQuantity: decimal("reserved_quantity", { precision: 15, scale: 4 }).notNull(),
  usedQuantity: decimal("used_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, fulfilled, cancelled
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniqueReservation: unique("unique_reservation").on(table.warehouseId, table.projectId, table.materialId, table.unitId),
  warehouseIdx: index("idx_stock_reservations_warehouse").on(table.warehouseId),
  projectIdx: index("idx_stock_reservations_project").on(table.projectId),
  materialIdx: index("idx_stock_reservations_material").on(table.materialId),
  statusIdx: index("idx_stock_reservations_status").on(table.status),
  checkReservedPositive: check("check_reserved_positive", sql`reserved_quantity > 0`),
  checkUsedNonNegative: check("check_used_non_negative", sql`used_quantity >= 0`),
  checkUsedLessOrEqual: check("check_used_lte_reserved", sql`used_quantity <= reserved_quantity`),
}));

// 4. Stok Hareketleri (Stock Movements) - Ana kayıt
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  movementCode: varchar("movement_code", { length: 50 }).notNull().unique(),
  movementType: varchar("movement_type", { length: 20 }).notNull(), // giris, cikis, transfer, sayim_duzeltme, iade
  movementDate: timestamp("movement_date").notNull().defaultNow(),
  sourceWarehouseId: integer("source_warehouse_id").references(() => warehouses.id),
  targetWarehouseId: integer("target_warehouse_id").references(() => warehouses.id),
  projectId: integer("project_id").references(() => projects.id),
  companyId: integer("company_id").references(() => companies.id),
  isFree: boolean("is_free").notNull().default(false),
  referenceType: varchar("reference_type", { length: 30 }), // satin_alma, taseron_teslim, iade, sayim, serbest
  referenceNo: varchar("reference_no", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("taslak"), // taslak, onaylandi, iptal
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  codeIdx: index("idx_stock_movements_code").on(table.movementCode),
  typeIdx: index("idx_stock_movements_type").on(table.movementType),
  dateIdx: index("idx_stock_movements_date").on(table.movementDate),
  sourceIdx: index("idx_stock_movements_source").on(table.sourceWarehouseId),
  targetIdx: index("idx_stock_movements_target").on(table.targetWarehouseId),
  projectIdx: index("idx_stock_movements_project").on(table.projectId),
  companyIdx: index("idx_stock_movements_company").on(table.companyId),
  statusIdx: index("idx_stock_movements_status").on(table.status),
  isFreeIdx: index("idx_stock_movements_is_free").on(table.isFree),
}));

// 5. Stok Hareket Detayları (Stock Movement Items)
export const stockMovementItems = pgTable("stock_movement_items", {
  id: serial("id").primaryKey(),
  movementId: integer("movement_id").notNull().references(() => stockMovements.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull(),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  lineTotalCents: integer("line_total_cents").notNull().default(0),
  isFree: boolean("is_free").notNull().default(false),
  notes: text("notes"),
}, (table) => ({
  movementIdx: index("idx_stock_movement_items_movement").on(table.movementId),
  materialIdx: index("idx_stock_movement_items_material").on(table.materialId),
  unitIdx: index("idx_stock_movement_items_unit").on(table.unitId),
  checkQuantityPositive: check("check_item_quantity_positive", sql`quantity > 0`),
  checkPriceNonNegative: check("check_item_price_non_negative", sql`unit_price_cents >= 0`),
}));

// 6. Taşeron Malzeme Takibi (Subcontractor Materials)
export const subcontractorMaterials = pgTable("subcontractor_materials", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  givenQuantity: decimal("given_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  usedQuantity: decimal("used_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  returnedQuantity: decimal("returned_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  wasteQuantity: decimal("waste_quantity", { precision: 15, scale: 4 }).notNull().default("0"),
  isFree: boolean("is_free").notNull().default(false),
  lastUpdateDate: timestamp("last_update_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  uniqueSubMaterial: unique("unique_subcontractor_material").on(table.companyId, table.projectId, table.materialId, table.unitId),
  companyIdx: index("idx_sub_materials_company").on(table.companyId),
  projectIdx: index("idx_sub_materials_project").on(table.projectId),
  warehouseIdx: index("idx_sub_materials_warehouse").on(table.warehouseId),
  materialIdx: index("idx_sub_materials_material").on(table.materialId),
  checkGivenNonNeg: check("check_given_non_negative", sql`given_quantity >= 0`),
  checkUsedNonNeg: check("check_sub_used_non_negative", sql`used_quantity >= 0`),
  checkReturnedNonNeg: check("check_returned_non_negative", sql`returned_quantity >= 0`),
  checkWasteNonNeg: check("check_waste_non_negative", sql`waste_quantity >= 0`),
}));

// ========================
// STOK SİSTEMİ RELATIONS
// ========================

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  workArea: one(workAreas, {
    fields: [warehouses.workAreaId],
    references: [workAreas.id],
  }),
  manager: one(personnel, {
    fields: [warehouses.managerId],
    references: [personnel.id],
  }),
  stockLevels: many(stockLevels),
  stockReservations: many(stockReservations),
  createdByUser: one(users, {
    fields: [warehouses.createdBy],
    references: [users.id],
    relationName: "warehouseCreator",
  }),
  updatedByUser: one(users, {
    fields: [warehouses.updatedBy],
    references: [users.id],
    relationName: "warehouseUpdater",
  }),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [stockLevels.warehouseId],
    references: [warehouses.id],
  }),
  material: one(materials, {
    fields: [stockLevels.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [stockLevels.unitId],
    references: [units.id],
  }),
}));

export const stockReservationsRelations = relations(stockReservations, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [stockReservations.warehouseId],
    references: [warehouses.id],
  }),
  project: one(projects, {
    fields: [stockReservations.projectId],
    references: [projects.id],
  }),
  material: one(materials, {
    fields: [stockReservations.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [stockReservations.unitId],
    references: [units.id],
  }),
  createdByUser: one(users, {
    fields: [stockReservations.createdBy],
    references: [users.id],
    relationName: "reservationCreator",
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one, many }) => ({
  sourceWarehouse: one(warehouses, {
    fields: [stockMovements.sourceWarehouseId],
    references: [warehouses.id],
    relationName: "sourceMovements",
  }),
  targetWarehouse: one(warehouses, {
    fields: [stockMovements.targetWarehouseId],
    references: [warehouses.id],
    relationName: "targetMovements",
  }),
  project: one(projects, {
    fields: [stockMovements.projectId],
    references: [projects.id],
  }),
  company: one(companies, {
    fields: [stockMovements.companyId],
    references: [companies.id],
  }),
  items: many(stockMovementItems),
  createdByUser: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
    relationName: "movementCreator",
  }),
  approvedByUser: one(users, {
    fields: [stockMovements.approvedBy],
    references: [users.id],
    relationName: "movementApprover",
  }),
}));

export const stockMovementItemsRelations = relations(stockMovementItems, ({ one }) => ({
  movement: one(stockMovements, {
    fields: [stockMovementItems.movementId],
    references: [stockMovements.id],
  }),
  material: one(materials, {
    fields: [stockMovementItems.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [stockMovementItems.unitId],
    references: [units.id],
  }),
}));

export const subcontractorMaterialsRelations = relations(subcontractorMaterials, ({ one }) => ({
  company: one(companies, {
    fields: [subcontractorMaterials.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [subcontractorMaterials.projectId],
    references: [projects.id],
  }),
  warehouse: one(warehouses, {
    fields: [subcontractorMaterials.warehouseId],
    references: [warehouses.id],
  }),
  material: one(materials, {
    fields: [subcontractorMaterials.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [subcontractorMaterials.unitId],
    references: [units.id],
  }),
  createdByUser: one(users, {
    fields: [subcontractorMaterials.createdBy],
    references: [users.id],
    relationName: "subMaterialCreator",
  }),
}));

// ========================
// STOK SİSTEMİ ZOD SCHEMAS
// ========================

// Warehouses Schemas
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
});
export const updateWarehouseSchema = insertWarehouseSchema.partial();
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type UpdateWarehouse = z.infer<typeof updateWarehouseSchema>;

// Stock Levels Schemas
export const insertStockLevelSchema = createInsertSchema(stockLevels).omit({
  id: true,
  updatedAt: true,
  updatedBy: true,
}).extend({
  currentQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Miktar negatif olamaz"),
  reservedQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Rezerve miktar negatif olamaz").optional(),
});
export const updateStockLevelSchema = insertStockLevelSchema.partial();
export type StockLevel = typeof stockLevels.$inferSelect;
export type InsertStockLevel = z.infer<typeof insertStockLevelSchema>;
export type UpdateStockLevel = z.infer<typeof updateStockLevelSchema>;

// Stock Reservations Schemas
export const insertStockReservationSchema = createInsertSchema(stockReservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  reservedQuantity: z.string().refine((val) => parseFloat(val) > 0, "Rezerve miktar pozitif olmalıdır"),
  usedQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Kullanılan miktar negatif olamaz").optional(),
  status: z.enum(["active", "fulfilled", "cancelled"]).default("active"),
});
export const updateStockReservationSchema = insertStockReservationSchema.partial();
export type StockReservation = typeof stockReservations.$inferSelect;
export type InsertStockReservation = z.infer<typeof insertStockReservationSchema>;
export type UpdateStockReservation = z.infer<typeof updateStockReservationSchema>;

// Stock Movements Schemas
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  approvedBy: true,
  approvedAt: true,
}).extend({
  movementType: z.enum(["giris", "cikis", "transfer", "sayim_duzeltme", "iade"]),
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/, "Geçersiz tarih formatı").optional(),
  status: z.enum(["taslak", "onaylandi", "iptal"]).default("taslak"),
  referenceType: z.enum(["satin_alma", "taseron_teslim", "iade", "sayim", "serbest"]).optional(),
});
export const updateStockMovementSchema = insertStockMovementSchema.partial();
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type UpdateStockMovement = z.infer<typeof updateStockMovementSchema>;

// Stock Movement Items Schemas
export const insertStockMovementItemSchema = createInsertSchema(stockMovementItems).omit({
  id: true,
  movementId: true,
}).extend({
  quantity: z.string().refine((val) => parseFloat(val) > 0, "Miktar pozitif olmalıdır"),
  unitPriceCents: z.number().int().min(0, "Birim fiyat negatif olamaz").default(0),
  lineTotalCents: z.number().int().min(0, "Satır toplamı negatif olamaz").default(0),
});
export const updateStockMovementItemSchema = insertStockMovementItemSchema.partial();
export type StockMovementItem = typeof stockMovementItems.$inferSelect;
export type InsertStockMovementItem = z.infer<typeof insertStockMovementItemSchema>;
export type UpdateStockMovementItem = z.infer<typeof updateStockMovementItemSchema>;

// Subcontractor Materials Schemas
export const insertSubcontractorMaterialSchema = createInsertSchema(subcontractorMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  lastUpdateDate: true,
}).extend({
  givenQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Verilen miktar negatif olamaz").optional(),
  usedQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Kullanılan miktar negatif olamaz").optional(),
  returnedQuantity: z.string().refine((val) => parseFloat(val) >= 0, "İade miktar negatif olamaz").optional(),
  wasteQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Fire miktar negatif olamaz").optional(),
});
export const updateSubcontractorMaterialSchema = insertSubcontractorMaterialSchema.partial();
export type SubcontractorMaterial = typeof subcontractorMaterials.$inferSelect;
export type InsertSubcontractorMaterial = z.infer<typeof insertSubcontractorMaterialSchema>;
export type UpdateSubcontractorMaterial = z.infer<typeof updateSubcontractorMaterialSchema>;

// ========================
// YER TESLİMİ (SITE HANDOVER) MODÜLÜ
// ========================

// 1. Site Handovers - Ana Tablo
export const siteHandovers = pgTable("site_handovers", {
  id: serial("id").primaryKey(),
  pypId: integer("pyp_id").notNull().references(() => projectPyps.id),
  handoverCode: varchar("handover_code", { length: 50 }).notNull().unique(),
  handoverDate: date("handover_date").notNull(),
  handoverType: varchar("handover_type", { length: 30 }).notNull().default("initial"),
  // initial: ilk teslim, revision: revizyon, partial: kısmi teslim

  // Kurum bilgileri
  institutionName: varchar("institution_name", { length: 255 }),
  institutionRepresentative: varchar("institution_representative", { length: 255 }),

  // Taşeron ataması
  subcontractorId: integer("subcontractor_id").references(() => companies.id),

  // Konum
  locationDescription: text("location_description"),
  coordinateX: varchar("coordinate_x", { length: 50 }),
  coordinateY: varchar("coordinate_y", { length: 50 }),

  // Durum yönetimi
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  // draft -> pending_approval -> approved -> completed -> cancelled

  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  pypIdx: index("idx_site_handovers_pyp").on(table.pypId),
  codeIdx: index("idx_site_handovers_code").on(table.handoverCode),
  statusIdx: index("idx_site_handovers_status").on(table.status),
  dateIdx: index("idx_site_handovers_date").on(table.handoverDate),
  subcontractorIdx: index("idx_site_handovers_subcontractor").on(table.subcontractorId),
  activeIdx: index("idx_site_handovers_active").on(table.isActive),
  checkStatusValue: check("check_sh_status_value",
    sql`status IN ('draft', 'pending_approval', 'approved', 'completed', 'cancelled')`),
  checkHandoverType: check("check_sh_handover_type",
    sql`handover_type IN ('initial', 'revision', 'partial')`),
}));

// 2. Site Handover Participants - Katılımcılar
export const siteHandoverParticipants = pgTable("site_handover_participants", {
  id: serial("id").primaryKey(),
  handoverId: integer("handover_id").notNull()
    .references(() => siteHandovers.id, { onDelete: "cascade" }),
  personnelId: integer("personnel_id").references(() => personnel.id),
  // Dış katılımcılar için (kurum temsilcisi vb.)
  externalName: varchar("external_name", { length: 255 }),
  externalTitle: varchar("external_title", { length: 100 }),
  externalOrganization: varchar("external_organization", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull(),
  // technician, engineer, institution_rep, subcontractor_rep, witness
  signedAt: timestamp("signed_at"),
  signatureData: text("signature_data"),
}, (table) => ({
  handoverIdx: index("idx_sh_participants_handover").on(table.handoverId),
  personnelIdx: index("idx_sh_participants_personnel").on(table.personnelId),
}));

// 3. Site Handover Items - Checklist / Punch List
export const siteHandoverItems = pgTable("site_handover_items", {
  id: serial("id").primaryKey(),
  handoverId: integer("handover_id").notNull()
    .references(() => siteHandovers.id, { onDelete: "cascade" }),
  itemOrder: integer("item_order").notNull().default(0),
  category: varchar("category", { length: 100 }),
  // terrain, infrastructure, safety, documentation
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending, ok, defect, na
  severity: varchar("severity", { length: 10 }),
  // low, medium, high, critical (sadece defect durumunda)
  defectDescription: text("defect_description"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => ({
  handoverIdx: index("idx_sh_items_handover").on(table.handoverId),
  statusIdx: index("idx_sh_items_status").on(table.status),
  categoryIdx: index("idx_sh_items_category").on(table.category),
}));

// 4. Site Handover Materials - Malzeme İhtiyaç Listesi
export const siteHandoverMaterials = pgTable("site_handover_materials", {
  id: serial("id").primaryKey(),
  handoverId: integer("handover_id").notNull()
    .references(() => siteHandovers.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  unitId: integer("unit_id").notNull().references(() => units.id),
  estimatedQuantity: decimal("estimated_quantity", { precision: 15, scale: 4 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 15, scale: 4 }),
  // Sahada gerçekleşen miktar (sonradan güncellenir)
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  handoverIdx: index("idx_sh_materials_handover").on(table.handoverId),
  materialIdx: index("idx_sh_materials_material").on(table.materialId),
  uniqueHandoverMaterial: unique("unique_sh_material")
    .on(table.handoverId, table.materialId, table.unitId),
}));

// 5. Site Handover Photos - Fotoğraf Dokümantasyonu
export const siteHandoverPhotos = pgTable("site_handover_photos", {
  id: serial("id").primaryKey(),
  handoverId: integer("handover_id").notNull()
    .references(() => siteHandovers.id, { onDelete: "cascade" }),
  handoverItemId: integer("handover_item_id")
    .references(() => siteHandoverItems.id, { onDelete: "set null" }),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: varchar("caption", { length: 500 }),
  photoType: varchar("photo_type", { length: 30 }).notNull().default("general"),
  // general, before, after, defect, panorama
  takenAt: timestamp("taken_at"),
  coordinateX: varchar("coordinate_x", { length: 50 }),
  coordinateY: varchar("coordinate_y", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => ({
  handoverIdx: index("idx_sh_photos_handover").on(table.handoverId),
  itemIdx: index("idx_sh_photos_item").on(table.handoverItemId),
  typeIdx: index("idx_sh_photos_type").on(table.photoType),
}));

// Site Handover Relations
export const siteHandoversRelations = relations(siteHandovers, ({ one, many }) => ({
  pyp: one(projectPyps, {
    fields: [siteHandovers.pypId],
    references: [projectPyps.id],
  }),
  subcontractor: one(companies, {
    fields: [siteHandovers.subcontractorId],
    references: [companies.id],
  }),
  participants: many(siteHandoverParticipants),
  items: many(siteHandoverItems),
  materials: many(siteHandoverMaterials),
  photos: many(siteHandoverPhotos),
}));

export const siteHandoverParticipantsRelations = relations(siteHandoverParticipants, ({ one }) => ({
  handover: one(siteHandovers, {
    fields: [siteHandoverParticipants.handoverId],
    references: [siteHandovers.id],
  }),
  personnel: one(personnel, {
    fields: [siteHandoverParticipants.personnelId],
    references: [personnel.id],
  }),
}));

export const siteHandoverItemsRelations = relations(siteHandoverItems, ({ one }) => ({
  handover: one(siteHandovers, {
    fields: [siteHandoverItems.handoverId],
    references: [siteHandovers.id],
  }),
}));

export const siteHandoverMaterialsRelations = relations(siteHandoverMaterials, ({ one }) => ({
  handover: one(siteHandovers, {
    fields: [siteHandoverMaterials.handoverId],
    references: [siteHandovers.id],
  }),
  material: one(materials, {
    fields: [siteHandoverMaterials.materialId],
    references: [materials.id],
  }),
  unit: one(units, {
    fields: [siteHandoverMaterials.unitId],
    references: [units.id],
  }),
}));

export const siteHandoverPhotosRelations = relations(siteHandoverPhotos, ({ one }) => ({
  handover: one(siteHandovers, {
    fields: [siteHandoverPhotos.handoverId],
    references: [siteHandovers.id],
  }),
  item: one(siteHandoverItems, {
    fields: [siteHandoverPhotos.handoverItemId],
    references: [siteHandoverItems.id],
  }),
}));

// Site Handover Zod Schemas
export const insertSiteHandoverSchema = createInsertSchema(siteHandovers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  completedBy: true,
}).extend({
  handoverType: z.enum(["initial", "revision", "partial"]).default("initial"),
  status: z.enum(["draft", "pending_approval", "approved", "completed", "cancelled"]).default("draft"),
  handoverDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Geçersiz tarih formatı"),
});
export const updateSiteHandoverSchema = insertSiteHandoverSchema.partial();
export type SiteHandover = typeof siteHandovers.$inferSelect;
export type InsertSiteHandover = z.infer<typeof insertSiteHandoverSchema>;
export type UpdateSiteHandover = z.infer<typeof updateSiteHandoverSchema>;

export const insertSiteHandoverParticipantSchema = createInsertSchema(siteHandoverParticipants).omit({
  id: true,
}).extend({
  role: z.enum(["technician", "engineer", "institution_rep", "subcontractor_rep", "witness"]),
});
export type SiteHandoverParticipant = typeof siteHandoverParticipants.$inferSelect;
export type InsertSiteHandoverParticipant = z.infer<typeof insertSiteHandoverParticipantSchema>;

export const insertSiteHandoverItemSchema = createInsertSchema(siteHandoverItems).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
  resolvedBy: true,
}).extend({
  status: z.enum(["pending", "ok", "defect", "na"]).default("pending"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});
export const updateSiteHandoverItemSchema = insertSiteHandoverItemSchema.partial();
export type SiteHandoverItem = typeof siteHandoverItems.$inferSelect;
export type InsertSiteHandoverItem = z.infer<typeof insertSiteHandoverItemSchema>;
export type UpdateSiteHandoverItem = z.infer<typeof updateSiteHandoverItemSchema>;

export const insertSiteHandoverMaterialSchema = createInsertSchema(siteHandoverMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  estimatedQuantity: z.string().refine((val) => parseFloat(val) > 0, "Miktar pozitif olmalıdır"),
  actualQuantity: z.string().refine((val) => parseFloat(val) >= 0, "Miktar negatif olamaz").optional(),
});
export const updateSiteHandoverMaterialSchema = insertSiteHandoverMaterialSchema.partial();
export type SiteHandoverMaterial = typeof siteHandoverMaterials.$inferSelect;
export type InsertSiteHandoverMaterial = z.infer<typeof insertSiteHandoverMaterialSchema>;
export type UpdateSiteHandoverMaterial = z.infer<typeof updateSiteHandoverMaterialSchema>;

export const insertSiteHandoverPhotoSchema = createInsertSchema(siteHandoverPhotos).omit({
  id: true,
  createdAt: true,
}).extend({
  photoType: z.enum(["general", "before", "after", "defect", "panorama"]).default("general"),
});
export type SiteHandoverPhoto = typeof siteHandoverPhotos.$inferSelect;
export type InsertSiteHandoverPhoto = z.infer<typeof insertSiteHandoverPhotoSchema>;

// ========================
// İSG (İŞ SAĞLIĞI GÜVENLİĞİ) MODÜLÜ
// ========================

// 1. OHS Inspection Templates - Denetim Şablonları
export const ohsInspectionTemplates = pgTable("ohs_inspection_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  // ppe_check, work_permit, fire_safety, electrical, excavation, height_work
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  codeIdx: index("idx_ohs_templates_code").on(table.code),
  categoryIdx: index("idx_ohs_templates_category").on(table.category),
  activeIdx: index("idx_ohs_templates_active").on(table.isActive),
}));

// 2. OHS Template Items - Şablon Maddeleri
export const ohsTemplateItems = pgTable("ohs_template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull()
    .references(() => ohsInspectionTemplates.id, { onDelete: "cascade" }),
  itemOrder: integer("item_order").notNull().default(0),
  category: varchar("category", { length: 100 }),
  question: text("question").notNull(),
  responseType: varchar("response_type", { length: 20 }).notNull().default("yes_no"),
  // yes_no, scale_1_5, text, numeric, photo_required
  isCritical: boolean("is_critical").notNull().default(false),
  referenceRegulation: varchar("reference_regulation", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  templateIdx: index("idx_ohs_template_items_template").on(table.templateId),
  orderIdx: index("idx_ohs_template_items_order").on(table.templateId, table.itemOrder),
}));

// 3. OHS Inspections - Denetim Kayıtları
export const ohsInspections = pgTable("ohs_inspections", {
  id: serial("id").primaryKey(),
  inspectionCode: varchar("inspection_code", { length: 50 }).notNull().unique(),
  templateId: integer("template_id").notNull()
    .references(() => ohsInspectionTemplates.id),
  pypId: integer("pyp_id").references(() => projectPyps.id),
  projectId: integer("project_id").references(() => projects.id),
  workAreaId: integer("work_area_id").references(() => workAreas.id),

  inspectionDate: date("inspection_date").notNull(),
  inspectorId: integer("inspector_id").notNull().references(() => personnel.id),

  status: varchar("status", { length: 20 }).notNull().default("draft"),
  // draft -> in_progress -> completed -> reviewed
  overallResult: varchar("overall_result", { length: 25 }),
  // compliant, non_compliant, partially_compliant

  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  // 0-100 uygunluk puanı

  summary: text("summary"),
  recommendations: text("recommendations"),

  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  codeIdx: index("idx_ohs_inspections_code").on(table.inspectionCode),
  templateIdx: index("idx_ohs_inspections_template").on(table.templateId),
  pypIdx: index("idx_ohs_inspections_pyp").on(table.pypId),
  projectIdx: index("idx_ohs_inspections_project").on(table.projectId),
  inspectorIdx: index("idx_ohs_inspections_inspector").on(table.inspectorId),
  dateIdx: index("idx_ohs_inspections_date").on(table.inspectionDate),
  statusIdx: index("idx_ohs_inspections_status").on(table.status),
  activeIdx: index("idx_ohs_inspections_active").on(table.isActive),
  checkStatusValue: check("check_ohs_insp_status",
    sql`status IN ('draft', 'in_progress', 'completed', 'reviewed')`),
}));

// 4. OHS Inspection Items - Denetim Madde Sonuçları
export const ohsInspectionItems = pgTable("ohs_inspection_items", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull()
    .references(() => ohsInspections.id, { onDelete: "cascade" }),
  templateItemId: integer("template_item_id").notNull()
    .references(() => ohsTemplateItems.id),
  response: varchar("response", { length: 50 }),
  isCompliant: boolean("is_compliant"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  inspectionIdx: index("idx_ohs_insp_items_inspection").on(table.inspectionId),
  templateItemIdx: index("idx_ohs_insp_items_template_item").on(table.templateItemId),
  uniqueInspItem: unique("unique_ohs_inspection_item")
    .on(table.inspectionId, table.templateItemId),
}));

// 5. OHS Inspection Photos - Denetim Fotoğrafları
export const ohsInspectionPhotos = pgTable("ohs_inspection_photos", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull()
    .references(() => ohsInspections.id, { onDelete: "cascade" }),
  inspectionItemId: integer("inspection_item_id")
    .references(() => ohsInspectionItems.id, { onDelete: "set null" }),
  photoUrl: text("photo_url").notNull(),
  caption: varchar("caption", { length: 500 }),
  takenAt: timestamp("taken_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
}, (table) => ({
  inspectionIdx: index("idx_ohs_insp_photos_inspection").on(table.inspectionId),
  itemIdx: index("idx_ohs_insp_photos_item").on(table.inspectionItemId),
}));

// 6. OHS Personnel Certifications - Personel İSG Sertifikaları
export const ohsPersonnelCertifications = pgTable("ohs_personnel_certifications", {
  id: serial("id").primaryKey(),
  personnelId: integer("personnel_id").notNull().references(() => personnel.id),
  certificationType: varchar("certification_type", { length: 100 }).notNull(),
  // isg_a, isg_b, isg_c, first_aid, fire_safety, height_work, electrical, forklift
  certificateNumber: varchar("certificate_number", { length: 100 }),
  issuedBy: varchar("issued_by", { length: 255 }),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date"),
  documentUrl: text("document_url"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // active, expired, suspended, revoked
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  personnelIdx: index("idx_ohs_certs_personnel").on(table.personnelId),
  typeIdx: index("idx_ohs_certs_type").on(table.certificationType),
  expiryIdx: index("idx_ohs_certs_expiry").on(table.expiryDate),
  statusIdx: index("idx_ohs_certs_status").on(table.status),
  activeIdx: index("idx_ohs_certs_active").on(table.isActive),
}));

// 7. OHS Incidents - İş Kazası / Olay Kayıtları
export const ohsIncidents = pgTable("ohs_incidents", {
  id: serial("id").primaryKey(),
  incidentCode: varchar("incident_code", { length: 50 }).notNull().unique(),
  pypId: integer("pyp_id").references(() => projectPyps.id),
  projectId: integer("project_id").references(() => projects.id),
  workAreaId: integer("work_area_id").references(() => workAreas.id),

  incidentDate: date("incident_date").notNull(),
  incidentTime: varchar("incident_time", { length: 8 }),

  incidentType: varchar("incident_type", { length: 30 }).notNull(),
  // injury, near_miss, property_damage, environmental, fire, other
  severity: varchar("severity", { length: 20 }).notNull(),
  // minor, moderate, serious, critical, fatal

  description: text("description").notNull(),
  location: text("location"),
  coordinateX: varchar("coordinate_x", { length: 50 }),
  coordinateY: varchar("coordinate_y", { length: 50 }),

  // Etkilenen personel
  affectedPersonnelId: integer("affected_personnel_id").references(() => personnel.id),
  injuryDescription: text("injury_description"),
  treatmentGiven: text("treatment_given"),
  hospitalReferral: boolean("hospital_referral").notNull().default(false),
  lostWorkDays: integer("lost_work_days").default(0),

  // Raporlama
  reportedById: integer("reported_by_id").notNull().references(() => personnel.id),
  reportedToSgk: boolean("reported_to_sgk").notNull().default(false),
  sgkReportDate: date("sgk_report_date"),

  rootCause: text("root_cause"),
  preventiveMeasures: text("preventive_measures"),

  status: varchar("status", { length: 20 }).notNull().default("reported"),
  // reported -> investigating -> resolved -> closed

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  codeIdx: index("idx_ohs_incidents_code").on(table.incidentCode),
  pypIdx: index("idx_ohs_incidents_pyp").on(table.pypId),
  projectIdx: index("idx_ohs_incidents_project").on(table.projectId),
  dateIdx: index("idx_ohs_incidents_date").on(table.incidentDate),
  typeIdx: index("idx_ohs_incidents_type").on(table.incidentType),
  severityIdx: index("idx_ohs_incidents_severity").on(table.severity),
  statusIdx: index("idx_ohs_incidents_status").on(table.status),
  affectedIdx: index("idx_ohs_incidents_affected").on(table.affectedPersonnelId),
  activeIdx: index("idx_ohs_incidents_active").on(table.isActive),
}));

// 8. OHS Corrective Actions - Düzeltici Faaliyetler
export const ohsCorrectiveActions = pgTable("ohs_corrective_actions", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id")
    .references(() => ohsInspections.id),
  incidentId: integer("incident_id")
    .references(() => ohsIncidents.id),
  inspectionItemId: integer("inspection_item_id")
    .references(() => ohsInspectionItems.id),

  actionCode: varchar("action_code", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  // low, medium, high, critical

  assignedToId: integer("assigned_to_id").references(() => personnel.id),
  assignedCompanyId: integer("assigned_company_id").references(() => companies.id),

  dueDate: date("due_date").notNull(),
  completedDate: date("completed_date"),

  status: varchar("status", { length: 20 }).notNull().default("open"),
  // open -> in_progress -> completed -> verified -> closed

  verifiedById: integer("verified_by_id").references(() => personnel.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),

  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
}, (table) => ({
  inspectionIdx: index("idx_ohs_ca_inspection").on(table.inspectionId),
  incidentIdx: index("idx_ohs_ca_incident").on(table.incidentId),
  assignedIdx: index("idx_ohs_ca_assigned").on(table.assignedToId),
  statusIdx: index("idx_ohs_ca_status").on(table.status),
  dueDateIdx: index("idx_ohs_ca_due_date").on(table.dueDate),
  priorityIdx: index("idx_ohs_ca_priority").on(table.priority),
  activeIdx: index("idx_ohs_ca_active").on(table.isActive),
}));

// İSG Relations
export const ohsInspectionTemplatesRelations = relations(ohsInspectionTemplates, ({ many }) => ({
  items: many(ohsTemplateItems),
  inspections: many(ohsInspections),
}));

export const ohsTemplateItemsRelations = relations(ohsTemplateItems, ({ one }) => ({
  template: one(ohsInspectionTemplates, {
    fields: [ohsTemplateItems.templateId],
    references: [ohsInspectionTemplates.id],
  }),
}));

export const ohsInspectionsRelations = relations(ohsInspections, ({ one, many }) => ({
  template: one(ohsInspectionTemplates, {
    fields: [ohsInspections.templateId],
    references: [ohsInspectionTemplates.id],
  }),
  pyp: one(projectPyps, {
    fields: [ohsInspections.pypId],
    references: [projectPyps.id],
  }),
  project: one(projects, {
    fields: [ohsInspections.projectId],
    references: [projects.id],
  }),
  inspector: one(personnel, {
    fields: [ohsInspections.inspectorId],
    references: [personnel.id],
  }),
  items: many(ohsInspectionItems),
  photos: many(ohsInspectionPhotos),
  correctiveActions: many(ohsCorrectiveActions),
}));

export const ohsInspectionItemsRelations = relations(ohsInspectionItems, ({ one }) => ({
  inspection: one(ohsInspections, {
    fields: [ohsInspectionItems.inspectionId],
    references: [ohsInspections.id],
  }),
  templateItem: one(ohsTemplateItems, {
    fields: [ohsInspectionItems.templateItemId],
    references: [ohsTemplateItems.id],
  }),
}));

export const ohsIncidentsRelations = relations(ohsIncidents, ({ one, many }) => ({
  pyp: one(projectPyps, {
    fields: [ohsIncidents.pypId],
    references: [projectPyps.id],
  }),
  affectedPersonnel: one(personnel, {
    fields: [ohsIncidents.affectedPersonnelId],
    references: [personnel.id],
  }),
  correctiveActions: many(ohsCorrectiveActions),
}));

export const ohsCorrectiveActionsRelations = relations(ohsCorrectiveActions, ({ one }) => ({
  inspection: one(ohsInspections, {
    fields: [ohsCorrectiveActions.inspectionId],
    references: [ohsInspections.id],
  }),
  incident: one(ohsIncidents, {
    fields: [ohsCorrectiveActions.incidentId],
    references: [ohsIncidents.id],
  }),
  assignedTo: one(personnel, {
    fields: [ohsCorrectiveActions.assignedToId],
    references: [personnel.id],
  }),
}));

// İSG Zod Schemas
export const insertOhsTemplateSchema = createInsertSchema(ohsInspectionTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateOhsTemplateSchema = insertOhsTemplateSchema.partial();
export type OhsInspectionTemplate = typeof ohsInspectionTemplates.$inferSelect;
export type InsertOhsTemplate = z.infer<typeof insertOhsTemplateSchema>;
export type UpdateOhsTemplate = z.infer<typeof updateOhsTemplateSchema>;

export const insertOhsTemplateItemSchema = createInsertSchema(ohsTemplateItems).omit({
  id: true,
}).extend({
  responseType: z.enum(["yes_no", "scale_1_5", "text", "numeric", "photo_required"]).default("yes_no"),
});
export const updateOhsTemplateItemSchema = insertOhsTemplateItemSchema.partial();
export type OhsTemplateItem = typeof ohsTemplateItems.$inferSelect;
export type InsertOhsTemplateItem = z.infer<typeof insertOhsTemplateItemSchema>;
export type UpdateOhsTemplateItem = z.infer<typeof updateOhsTemplateItemSchema>;

export const insertOhsInspectionSchema = createInsertSchema(ohsInspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: true,
  reviewedAt: true,
  complianceScore: true,
  overallResult: true,
}).extend({
  status: z.enum(["draft", "in_progress", "completed", "reviewed"]).default("draft"),
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Geçersiz tarih formatı"),
});
export const updateOhsInspectionSchema = insertOhsInspectionSchema.partial();
export type OhsInspection = typeof ohsInspections.$inferSelect;
export type InsertOhsInspection = z.infer<typeof insertOhsInspectionSchema>;
export type UpdateOhsInspection = z.infer<typeof updateOhsInspectionSchema>;

export const insertOhsInspectionItemSchema = createInsertSchema(ohsInspectionItems).omit({
  id: true,
  createdAt: true,
});
export type OhsInspectionItem = typeof ohsInspectionItems.$inferSelect;
export type InsertOhsInspectionItem = z.infer<typeof insertOhsInspectionItemSchema>;

export const insertOhsCertificationSchema = createInsertSchema(ohsPersonnelCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Geçersiz tarih formatı"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Geçersiz tarih formatı").optional(),
  status: z.enum(["active", "expired", "suspended", "revoked"]).default("active"),
});
export const updateOhsCertificationSchema = insertOhsCertificationSchema.partial();
export type OhsPersonnelCertification = typeof ohsPersonnelCertifications.$inferSelect;
export type InsertOhsCertification = z.infer<typeof insertOhsCertificationSchema>;
export type UpdateOhsCertification = z.infer<typeof updateOhsCertificationSchema>;

export const insertOhsIncidentSchema = createInsertSchema(ohsIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  incidentType: z.enum(["injury", "near_miss", "property_damage", "environmental", "fire", "other"]),
  severity: z.enum(["minor", "moderate", "serious", "critical", "fatal"]),
  status: z.enum(["reported", "investigating", "resolved", "closed"]).default("reported"),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Geçersiz tarih formatı"),
});
export const updateOhsIncidentSchema = insertOhsIncidentSchema.partial();
export type OhsIncident = typeof ohsIncidents.$inferSelect;
export type InsertOhsIncident = z.infer<typeof insertOhsIncidentSchema>;
export type UpdateOhsIncident = z.infer<typeof updateOhsIncidentSchema>;

export const insertOhsCorrectiveActionSchema = createInsertSchema(ohsCorrectiveActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedById: true,
  verifiedAt: true,
  verificationNotes: true,
  completedDate: true,
}).extend({
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["open", "in_progress", "completed", "verified", "closed"]).default("open"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Geçersiz tarih formatı"),
});
export const updateOhsCorrectiveActionSchema = insertOhsCorrectiveActionSchema.partial();
export type OhsCorrectiveAction = typeof ohsCorrectiveActions.$inferSelect;
export type InsertOhsCorrectiveAction = z.infer<typeof insertOhsCorrectiveActionSchema>;
export type UpdateOhsCorrectiveAction = z.infer<typeof updateOhsCorrectiveActionSchema>;

// ========================
// HAKEDİŞ HİYERARŞİSİ - BİRLEŞTİRME GEÇMİŞİ
// ========================

export const progressPaymentMergeHistory = pgTable("progress_payment_merge_history", {
  id: serial("id").primaryKey(),
  targetPaymentId: integer("target_payment_id").notNull()
    .references(() => progressPayments.id),
  sourcePaymentId: integer("source_payment_id").notNull()
    .references(() => progressPayments.id),
  mergedAt: timestamp("merged_at").notNull().defaultNow(),
  mergedBy: integer("merged_by").references(() => users.id),
  notes: text("notes"),
}, (table) => ({
  targetIdx: index("idx_pp_merge_target").on(table.targetPaymentId),
  sourceIdx: index("idx_pp_merge_source").on(table.sourcePaymentId),
  uniqueMerge: unique("unique_pp_merge").on(table.targetPaymentId, table.sourcePaymentId),
}));

export type ProgressPaymentMergeHistory = typeof progressPaymentMergeHistory.$inferSelect;

// ========================
// BOT SESSIONS - Telegram / WhatsApp bot oturumları
// ========================

export const botSessions = pgTable("bot_sessions", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 20 }).notNull(), // 'telegram' | 'whatsapp'
  platformUserId: varchar("platform_user_id", { length: 100 }).notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  personnelId: integer("personnel_id").references(() => personnel.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  tenantDomain: varchar("tenant_domain", { length: 200 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueSession: unique("unique_bot_session").on(table.platform, table.platformUserId),
  userIdx: index("idx_bot_sessions_user").on(table.userId),
  platformIdx: index("idx_bot_sessions_platform").on(table.platform, table.isActive),
}));

export type BotSession = typeof botSessions.$inferSelect;
