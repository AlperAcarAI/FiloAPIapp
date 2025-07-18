import { pgTable, text, serial, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
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

// Fleet management test data schemas
export const aracDurumEnum = pgEnum('arac_durum', ['aktif', 'bakim', 'ariza', 'pasif']);
export const sahiplikEnum = pgEnum('sahiplik', ['sirket', 'kiralama', 'leasing']);

export const araclar = pgTable("araclar", {
  arac_id: uuid("arac_id").primaryKey().defaultRandom(),
  plaka: text("plaka").notNull().unique(),
  marka: text("marka").notNull(),
  model: text("model").notNull(),
  tur: text("tur").notNull(), // Kamyon, Otobüs, Forklift, vs
  sahiplik: sahiplikEnum("sahiplik").notNull(),
  edinim_tarihi: timestamp("edinim_tarihi").notNull(),
  kullanim_sayaci: text("kullanim_sayaci"), // km veya saat
  durum: aracDurumEnum("durum").notNull().default('aktif'),
  son_konum: text("son_konum"),
  yakit_seviyesi: text("yakit_seviyesi"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const soforler = pgTable("soforler", {
  sofor_id: uuid("sofor_id").primaryKey().defaultRandom(),
  ad_soyad: text("ad_soyad").notNull(),
  tc_kimlik: text("tc_kimlik").notNull().unique(),
  ehliyet_no: text("ehliyet_no").notNull(),
  telefon: text("telefon").notNull(),
  durum: text("durum").notNull().default('aktif'),
  created_at: timestamp("created_at").defaultNow(),
});

export const yolculuklar = pgTable("yolculuklar", {
  yolculuk_id: uuid("yolculuk_id").primaryKey().defaultRandom(),
  arac_id: uuid("arac_id").references(() => araclar.arac_id),
  sofor_id: uuid("sofor_id").references(() => soforler.sofor_id),
  baslangic_noktasi: text("baslangic_noktasi").notNull(),
  bitis_noktasi: text("bitis_noktasi").notNull(),
  baslama_zamani: timestamp("baslama_zamani").notNull(),
  bitis_zamani: timestamp("bitis_zamani"),
  mesafe: text("mesafe"),
  durum: text("durum").notNull().default('devam_ediyor'),
  created_at: timestamp("created_at").defaultNow(),
});

export type Arac = typeof araclar.$inferSelect;
export type Sofor = typeof soforler.$inferSelect;
export type Yolculuk = typeof yolculuklar.$inferSelect;
