// ==============================================================================
// DEWI JATENG - Drizzle ORM Schema (PostgreSQL 16 & PostGIS)
// Pure PostgreSQL Architecture (Without Supabase dependency)
// ==============================================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  doublePrecision,
  numeric,
  boolean,
  timestamp,
  serial,
  jsonb,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom type untuk PostGIS Point geometry (EPSG:4326)
export const postgisGeometryPoint = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
});

// ------------------------------------------------------------------------------
// 1. Tabel Profil Desa Wisata (tourist_villages)
// ------------------------------------------------------------------------------
export const touristVillages = pgTable('tourist_villages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  regency: varchar('regency', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  geom: postgisGeometryPoint('geom'),
  category: varchar('category', { length: 30 }).default('BERKEMBANG').notNull(),
  pokdarwisName: varchar('pokdarwis_name', { length: 150 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 30 }).notNull(),
  trustScore: numeric('trust_score', { precision: 5, scale: 2 })
    .default('80.00')
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 2. Tabel Tarif Resmi (official_tariffs)
// ------------------------------------------------------------------------------
export const officialTariffs = pgTable('official_tariffs', {
  id: serial('id').primaryKey(),
  villageId: uuid('village_id')
    .references(() => touristVillages.id, { onDelete: 'cascade' })
    .notNull(),
  itemName: varchar('item_name', { length: 150 }).notNull(),
  tariffType: varchar('tariff_type', { length: 50 }).notNull(),
  price: integer('price').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 3. Tabel Bantuan Hibah / APBDes (village_grants)
// ------------------------------------------------------------------------------
export const villageGrants = pgTable('village_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  villageId: uuid('village_id')
    .references(() => touristVillages.id, { onDelete: 'cascade' })
    .notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  fundingSource: varchar('funding_source', { length: 150 }).notNull(),
  // Rincian tiga sumber dana (opsional; total_allocated = jumlah ketiganya).
  apbdesAmount: bigint('apbdes_amount', { mode: 'number' }).default(0).notNull(),
  banprovAmount: bigint('banprov_amount', { mode: 'number' }).default(0).notNull(),
  padesAmount: bigint('pades_amount', { mode: 'number' }).default(0).notNull(),
  totalAllocated: bigint('total_allocated', { mode: 'number' }).notNull(),
  totalRealized: bigint('total_realized', { mode: 'number' }).default(0).notNull(),
  remainingBalance: bigint('remaining_balance', { mode: 'number' })
    .default(0)
    .notNull(),
  lpjDocumentUrl: text('lpj_document_url'),
  lpjStatus: varchar('lpj_status', { length: 30 })
    .default('PENDING_UPLOAD')
    .notNull(),
  lpjReviewNotes: text('lpj_review_notes'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 4. Tabel Rincian Pos Belanja Modal LPJ (grant_expenses)
// ------------------------------------------------------------------------------
export const grantExpenses = pgTable('grant_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  grantId: uuid('grant_id')
    .references(() => villageGrants.id, { onDelete: 'cascade' })
    .notNull(),
  activityName: varchar('activity_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  volume: numeric('volume', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 30 }).notNull(),
  claimedUnitPrice: bigint('claimed_unit_price', { mode: 'number' }).notNull(),
  budgetAllocated: bigint('budget_allocated', { mode: 'number' }).notNull(),
  amountRealized: bigint('amount_realized', { mode: 'number' }).notNull(),
  remainingAmount: bigint('remaining_amount', { mode: 'number' })
    .default(0)
    .notNull(),
  aiAnomalyFlag: boolean('ai_anomaly_flag').default(false).notNull(),
  anomalyNote: text('anomaly_note'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 5. Tabel Acuan Standar Satuan Harga Pemprov Jateng (ssh_reference_rates)
// ------------------------------------------------------------------------------
export const sshReferenceRates = pgTable('ssh_reference_rates', {
  id: serial('id').primaryKey(),
  itemCode: varchar('item_code', { length: 50 }).notNull(),
  itemName: varchar('item_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 30 }).notNull(),
  standardPrice: bigint('standard_price', { mode: 'number' }).notNull(),
  regency: varchar('regency', { length: 100 }).notNull(),
  effectiveYear: integer('effective_year').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 6. Tabel Laporan Aduan Masyarakat (incident_reports)
// ------------------------------------------------------------------------------
export const incidentReports = pgTable('incident_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportCode: varchar('report_code', { length: 30 }).unique().notNull(),
  villageId: uuid('village_id')
    .references(() => touristVillages.id, { onDelete: 'cascade' })
    .notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  photoBeforeUrl: text('photo_before_url').notNull(),
  // Foto pertama tetap di photo_before_url agar semua pembacaan lama aman;
  // kolom ini menyimpan seluruh lampiran (maks 3) untuk galeri.
  photoBeforeUrls: jsonb('photo_before_urls')
    .$type<string[]>()
    .default([])
    .notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  geom: postgisGeometryPoint('geom'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  reporterContactHash: varchar('reporter_contact_hash', { length: 64 }),
  status: varchar('status', { length: 30 }).default('SUBMITTED').notNull(),
  // Tenggat SLA: PUNGLI 24 jam, kategori lain 168 jam sejak laporan dibuat.
  deadlineAt: timestamp('deadline_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 7. Tabel Bukti Hasil Perbaikan Fisik / Proof-of-Fix (report_resolutions)
// ------------------------------------------------------------------------------
export const reportResolutions = pgTable('report_resolutions', {
  id: serial('id').primaryKey(),
  reportId: uuid('report_id')
    .references(() => incidentReports.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  actionSummary: text('action_summary').notNull(),
  photoAfterUrl: text('photo_after_url').notNull(),
  officerName: varchar('officer_name', { length: 150 }).notNull(),
  exifTimestampVerified: boolean('exif_timestamp_verified')
    .default(false)
    .notNull(),
  exifPhotoDate: timestamp('exif_photo_date', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 8. Tabel Pengguna Sistem (users) - Akun Disbudparekraf & Desa
// ------------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 60 }).notNull().unique(),
  email: varchar('email', { length: 150 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'desa' | 'disbudparekraf'
  villageId: uuid('village_id').references(() => touristVillages.id, { onDelete: 'cascade' }),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 30 }), // dipakai sebagai Nomor WhatsApp
  nip: varchar('nip', { length: 30 }),
  institution: varchar('institution', { length: 150 }),
  regency: varchar('regency', { length: 100 }), // wilayah tugas
  status: varchar('status', { length: 20 }).default('AKTIF').notNull(),
  // MENUNGGU | DISETUJUI | DITOLAK — hanya berarti untuk akun hasil pendaftaran mandiri.
  approvalStatus: varchar('approval_status', { length: 20 }).default('DISETUJUI').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  mustChangePassword: boolean('must_change_password').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// 9. Tabel Token Autentikasi (auth_tokens)
// Menyimpan token verifikasi email, undangan aktivasi, dan reset kata sandi.
// Hanya hash token yang disimpan — token asli hanya ada di tautan yang dikirim.
// ------------------------------------------------------------------------------
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(), // VERIFIKASI_EMAIL | UNDANGAN_AKTIVASI | RESET_SANDI
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ------------------------------------------------------------------------------
// Drizzle Relations Mapping
// ------------------------------------------------------------------------------
export const touristVillagesRelations = relations(touristVillages, ({ many }) => ({
  tariffs: many(officialTariffs),
  grants: many(villageGrants),
  reports: many(incidentReports),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  village: one(touristVillages, {
    fields: [users.villageId],
    references: [touristVillages.id],
  }),
  authTokens: many(authTokens),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id],
  }),
}));

export const officialTariffsRelations = relations(officialTariffs, ({ one }) => ({
  village: one(touristVillages, {
    fields: [officialTariffs.villageId],
    references: [touristVillages.id],
  }),
}));

export const villageGrantsRelations = relations(villageGrants, ({ one, many }) => ({
  village: one(touristVillages, {
    fields: [villageGrants.villageId],
    references: [touristVillages.id],
  }),
  expenses: many(grantExpenses),
}));

export const grantExpensesRelations = relations(grantExpenses, ({ one }) => ({
  grant: one(villageGrants, {
    fields: [grantExpenses.grantId],
    references: [villageGrants.id],
  }),
}));

export const incidentReportsRelations = relations(incidentReports, ({ one }) => ({
  village: one(touristVillages, {
    fields: [incidentReports.villageId],
    references: [touristVillages.id],
  }),
  resolution: one(reportResolutions, {
    fields: [incidentReports.id],
    references: [reportResolutions.reportId],
  }),
}));

export const reportResolutionsRelations = relations(reportResolutions, ({ one }) => ({
  report: one(incidentReports, {
    fields: [reportResolutions.reportId],
    references: [incidentReports.id],
  }),
}));
