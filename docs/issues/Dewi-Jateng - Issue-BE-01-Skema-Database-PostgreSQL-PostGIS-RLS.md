---
type: project-issue
project_id: "Dewi-Jateng"
subproject: "be_dewijateng"
issue_id: "BE-01"
title: "Skema Database Relasional PostgreSQL 16 & Spasial PostGIS 3.4"
status: completed
priority: critical
created: 2026-11-04
updated: 2026-11-04
tags:
  - dewi-jateng
  - backend
  - database
  - postgresql
  - postgis
  - drizzle-orm
---

# ISSUE-BE-01: Skema Database Relasional PostgreSQL 16 & Drizzle ORM (PostGIS)

## 1. Konteks & Deskripsi Fitur
Menyusun skema data relasional terpadu pada basis data PostgreSQL 16 dan PostGIS 3.4 (lingkungan mandiri OrbStack lokal & Production) serta pemetaan Drizzle ORM (`drizzle-orm` & `drizzle-kit`). Skema ini memodelkan seluruh siklus transparansi desa wisata Jawa Tengah: data profil desa, tarif resmi, bantuan hibah APBD, pos rincian belanja modal, standar satuan harga (SSH) acuan, pelaporan aduan masyarakat, serta riwayat penyelesaian berbukti foto fisik (*Proof-of-Fix*).

## 2. Acuan Arsitektur & Berkas Terkait
- Dokumen Rujukan: [[Dewi-Jateng - Database-Schema-and-Models]] & [[Dewi-Jateng - System-Architecture]]
- Prinsip Desain: *Spatial Integrity, Zero Vendor Lock-in & Full Traceability*. Koordinat geospasial disinkronisasi otomatis via trigger ke tipe geometri PostGIS EPSG:4326 dengan indeks spasial `GIST(geom)`.

## 3. Berkas Terkait (Affected Files)

| Komponen | Path Berkas | Aksi / Peran |
| :--- | :--- | :--- |
| DDL SQL Init | `docker/init-db.sql` | Definisi tabel, ekstensi, fungsi trigger spasial, dan indeks awal OrbStack |
| Drizzle Schema | `lib/db/schema.ts` | Skema deklaratif Drizzle ORM (7 tabel, relasi, tipe PostGIS geometry) |
| Drizzle Config | `drizzle.config.ts` | Konfigurasi dialect PostgreSQL dan credential database |
| DB Pool & Drizzle Client | `lib/db.ts` | Singleton connection pool PostgreSQL 16 & Drizzle instance anti memory-leak |
| TypeScript Types | `types/database.ts` | Tipe data antarmuka tabel dan enum TypeScript terstandarisasi |

## 4. Spesifikasi 7 Tabel Inti & Relasi
1. **`tourist_villages`:**
   - Kolom: `id` (UUID PK), `slug` (VARCHAR unique), `name`, `regency`, `district`, `latitude`, `longitude`, `geom` (GEOMETRY Point 4326), `category` (RINTISAN/BERKEMBANG/MAJU/MANDIRI), `pokdarwis_name`, `contact_phone`, `trust_score` (DECIMAL 5,2), timestamps.
2. **`official_tariffs`:**
   - Kolom: `id` (SERIAL PK), `village_id` (FK), `item_name`, `tariff_type` (ENTRY_TICKET, PARKING_MOTOR, PARKING_CAR, PACKAGE_TOUR), `price`, `is_active`, timestamps.
3. **`village_grants`:**
   - Kolom: `id` (UUID PK), `village_id` (FK), `fiscal_year` (INT), `funding_source`, `total_allocated`, `total_realized`, `remaining_balance`, `lpj_document_url`, `lpj_status` (PENDING_UPLOAD, SUBMITTED, VERIFIED), `uploaded_at`, timestamps.
4. **`grant_expenses`:**
   - Kolom: `id` (UUID PK), `grant_id` (FK), `activity_name`, `category` (MATERIAL_FISIK, UPAH_TENAGA, KESELAMATAN_K3, OPERASIONAL), `volume`, `unit`, `claimed_unit_price`, `budget_allocated`, `amount_realized`, `remaining_amount`, `ai_anomaly_flag`, `anomaly_note`, timestamps.
5. **`ssh_reference_rates`:**
   - Kolom: `id` (SERIAL PK), `item_code`, `item_name`, `category`, `unit`, `standard_price`, `regency`, `effective_year`, timestamps.
6. **`incident_reports`:**
   - Kolom: `id` (UUID PK), `report_code` (VARCHAR unique format `LP-JTG-2026-XXXX`), `village_id` (FK), `category` (FASILITAS_RUSAK, PUNGLI, BAHAYA_K3, KEBERSIHAN), `title`, `description`, `photo_before_url`, `latitude`, `longitude`, `geom` (GEOMETRY Point 4326), `is_anonymous`, `reporter_contact_hash`, `status` (SUBMITTED, IN_PROGRESS, RESOLVED), timestamps.
7. **`report_resolutions`:**
   - Kolom: `id` (SERIAL PK), `report_id` (FK unique ke `incident_reports`), `action_summary`, `photo_after_url`, `officer_name`, `exif_timestamp_verified`, `exif_photo_date`, `resolved_at`.

## 5. Kriteria Keberterimaan (Acceptance Criteria)
- [x] AC-1: Ekstensi `uuid-ossp` dan `postgis` aktif di PostgreSQL 16.
- [x] AC-2: Trigger `update_geom_point()` otomatis memperbarui kolom `geom` saat terjadi `INSERT` atau `UPDATE` pada `latitude`/`longitude`.
- [x] AC-3: Seluruh foreign key (`ON DELETE CASCADE` atau `RESTRICT`) terpasang untuk menjaga integritas data relasional.
- [x] AC-4: Indeks performa terpasang pada `tourist_villages(regency)`, `tourist_villages(slug)`, `incident_reports(report_code)`, dan indeks spasial `GIST(geom)`.
- [x] AC-5: File `lib/db.ts` menyediakan helper singleton `query<T>()` yang lolos kompilasi build Next.js 14 tanpa error constraint generic.
- [x] AC-6: Berkas `types/database.ts` menyediakan definisi tipe TypeScript presisi untuk seluruh entitas tabel.

## 6. Catatan Teknis Trigger Spasial
```sql
CREATE OR REPLACE FUNCTION update_geom_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_villages_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON tourist_villages
FOR EACH ROW EXECUTE FUNCTION update_geom_point();
```
