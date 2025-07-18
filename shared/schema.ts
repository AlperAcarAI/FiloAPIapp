import { pgTable, text, serial, uuid, timestamp, pgEnum, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const apiDurumEnum = pgEnum('api_durum', ['aktif', 'pasif', 'hata']);

export const apis = pgTable("apis", {
  api_id: uuid("api_id").primaryKey().defaultRandom(),
  ad: text("ad").notNull(),
  aciklama: text("aciklama").notNull(),
  durum: apiDurumEnum("durum").notNull().default('aktif'),
  son_calistigi: timestamp("son_calistigi"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertApiSchema = createInsertSchema(apis).omit({
  api_id: true,
  created_at: true,
  updated_at: true,
});

export const updateApiSchema = createInsertSchema(apis).omit({
  api_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export type InsertApi = z.infer<typeof insertApiSchema>;
export type UpdateApi = z.infer<typeof updateApiSchema>;
export type Api = typeof apis.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Varlık yönetimi şeması
export const varlikTurEnum = pgEnum('varlik_tur', ['Binek', 'Kamyon', 'Forklift', 'Vinc', 'Ekskavator']);
export const sahiplikTuruEnum = pgEnum('sahiplik_turu', ['Sirket', 'Kiralik']);

export const varliklar = pgTable("varliklar", {
  varlik_id: uuid("varlik_id").primaryKey().defaultRandom(),
  tur: varlikTurEnum("tur").notNull(),
  marka: text("marka").notNull(),
  model: text("model").notNull(),
  plaka: text("plaka").notNull().unique(),
  sahiplik: sahiplikTuruEnum("sahiplik").notNull(),
  edinim_tarihi: date("edinim_tarihi").notNull(),
  kullanim_sayaci: integer("kullanim_sayaci").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertVarlikSchema = createInsertSchema(varliklar).omit({
  varlik_id: true,
  created_at: true,
  updated_at: true,
});

export const updateVarlikSchema = createInsertSchema(varliklar).omit({
  varlik_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export type InsertVarlik = z.infer<typeof insertVarlikSchema>;
export type UpdateVarlik = z.infer<typeof updateVarlikSchema>;
export type Varlik = typeof varliklar.$inferSelect;
