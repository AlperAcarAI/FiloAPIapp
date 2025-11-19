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
  iban: varchar("iban", { length: 34 }), // IBAN field added
  status: varchar("status", { length: 20 }),
  companyId: integer("company_id").references(() => companies.id),
  isActive: boolean("is_active").notNull().default(true),
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
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  personnelWorkAreaIdx: index("idx_personnel_work_areas_personnel").on(table.personnelId),
  workAreaIdx: index("idx_personnel_work_areas_work_area").on(table.workAreaId),
  projectIdx: index("idx_personnel_work_areas_project").on(table.projectId),
  activeIdx: index("idx_personnel_work_areas_active").on(table.isActive),
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
  entityType: varchar("entity_type", { length: 20 }).notNull(), // 'personnel', 'asset', 'company', 'work_area'
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
  entityTypeCheck: check("entity_type_check", sql`entity_type IN ('personnel', 'asset', 'company', 'work_area')`),
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
  entityType: z.enum(['personnel', 'asset', 'company', 'work_area']),
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

export const projectPypsRelations = relations(projectPyps, ({ one }) => ({
  project: one(projects, {
    fields: [projectPyps.projectId],
    references: [projects.id],
  }),
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
  projectId: integer("project_id").references(() => projects.id),
  pypId: integer("pyp_id").references(() => projectPyps.id),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  firmIdx: index("idx_fo_outage_process_firm").on(table.firmId),
  processorFirmIdx: index("idx_fo_outage_process_processor_firm").on(table.processorFirmId),
  projectIdx: index("idx_fo_outage_process_project").on(table.projectId),
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
  project: one(projects, {
    fields: [foOutageProcess.projectId],
    references: [projects.id],
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
