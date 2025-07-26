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
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  companyId: integer("company_id").notNull().references(() => companies.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => apiClients.id),
  keyHash: text("key_hash").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
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
  clientEndpointIdx: index("idx_rate_limit_client_endpoint").on(table.clientId, table.endpointId),
  windowIdx: index("idx_rate_limit_window").on(table.windowStart, table.windowEnd),
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
  status: varchar("status", { length: 20 }),
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
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => carModels.id),
  modelYear: integer("model_year").notNull(),
  plateNumber: varchar("plate_number", { length: 20 }).notNull().unique(),
  chassisNo: varchar("chassis_no", { length: 50 }),
  engineNo: varchar("engine_no", { length: 50 }),
  ownershipTypeId: integer("ownership_type_id").notNull().references(() => ownershipTypes.id),
  ownerCompanyId: integer("owner_company_id").references(() => companies.id),
  registerNo: varchar("register_no", { length: 50 }),
  registerDate: date("register_date"),
  purchaseDate: date("purchase_date"),
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
}).extend({
  modelYear: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  plateNumber: z.string().min(1).max(20),
});

export const updateAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
}).extend({
  modelYear: z.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
  plateNumber: z.string().min(1).max(20).optional(),
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
}, (table) => ({
  amountCheck: check("amount_cents_check", sql`amount_cents >= 0`),
}));

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
  kmHourLimit: integer("km_hour_limit").notNull(),
  kmTotalLimit: integer("km_total_limit").notNull(),
}, (table) => ({
  vatKmIdx: index("idx_rental_assets_vat_kmh").on(table.vatPercent, table.kmHourLimit),
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

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  userRoles: many(userRoles),
  apiTokens: many(apiTokens),
}));

// Zod schemas for key tables

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
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

export const insertWorkAreaSchema = createInsertSchema(workAreas).omit({
  id: true,
});

export const updateWorkAreaSchema = insertWorkAreaSchema.partial();

// Types
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type UpdateAsset = z.infer<typeof updateAssetSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// Company update schema
export const updateCompanySchema = insertCompanySchema.partial();
export type UpdateCompany = z.infer<typeof updateCompanySchema>;

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
export type PolicyType = typeof policyTypes.$inferSelect;
export type DamageType = typeof damageTypes.$inferSelect;
export type MaintenanceType = typeof maintenanceTypes.$inferSelect;

// Policy Type Schemas
export const insertPolicyTypeSchema = createInsertSchema(policyTypes).omit({
  id: true,
});

export type InsertPolicyType = z.infer<typeof insertPolicyTypeSchema>;

// Maintenance Type Schemas
export const insertMaintenanceTypeSchema = createInsertSchema(maintenanceTypes).omit({
  id: true,
});

export type InsertMaintenanceType = z.infer<typeof insertMaintenanceTypeSchema>;

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

