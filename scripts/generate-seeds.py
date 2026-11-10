import os
import json
import re
import uuid
import zipfile
import xml.etree.ElementTree as ET

EXCEL_PATH = 'data/desasentinel-v3.xlsx'

REGENCY_CENTERS = {
    'Kabupaten Banjarnegara': (-7.3986, 109.6970),
    'Kabupaten Banyumas': (-7.4500, 109.1670),
    'Kabupaten Batang': (-6.9080, 109.7340),
    'Kabupaten Blora': (-6.9700, 111.4180),
    'Kabupaten Boyolali': (-7.5330, 110.5960),
    'Kabupaten Brebes': (-6.8700, 109.0430),
    'Kabupaten Cilacap': (-7.7180, 109.0150),
    'Kabupaten Demak': (-6.8940, 110.6380),
    'Kabupaten Grobogan': (-7.0870, 110.9170),
    'Kabupaten Jepara': (-6.5890, 110.6680),
    'Kabupaten Karanganyar': (-7.5960, 110.9510),
    'Kabupaten Kebumen': (-7.6700, 109.6600),
    'Kabupaten Kendal': (-6.9240, 110.2040),
    'Kabupaten Klaten': (-7.7050, 110.6030),
    'Kabupaten Kudus': (-6.8050, 110.8410),
    'Kabupaten Magelang': (-7.5500, 110.2160),
    'Kabupaten Pati': (-6.7540, 111.0380),
    'Kabupaten Pekalongan': (-7.0270, 109.6230),
    'Kabupaten Pemalang': (-6.8930, 109.3810),
    'Kabupaten Purbalingga': (-7.3880, 109.3630),
    'Kabupaten Purworejo': (-7.7150, 110.0080),
    'Kabupaten Rembang': (-6.7070, 111.3440),
    'Kabupaten Semarang': (-7.2140, 110.4370),
    'Kabupaten Sragen': (-7.4260, 111.0220),
    'Kabupaten Sukoharjo': (-7.6830, 110.8350),
    'Kabupaten Tegal': (-6.9830, 109.1410),
    'Kabupaten Temanggung': (-7.3160, 110.1760),
    'Kabupaten Wonogiri': (-7.8150, 110.9250),
    'Kabupaten Wonosobo': (-7.3630, 109.9000),
    'Kota Magelang': (-7.4700, 110.2180),
    'Kota Pekalongan': (-6.8890, 109.6750),
    'Kota Salatiga': (-7.3300, 110.5080),
    'Kota Semarang': (-6.9660, 110.4380),
    'Kota Surakarta': (-7.5750, 110.8240),
    'Kota Tegal': (-6.8690, 109.1250),
}

KNOWN_DEMO_IDS = {
    ('candirejo', 'Kabupaten Magelang'): 'a0000000-0000-0000-0000-000000000002',
    ('getas', 'Kabupaten Semarang'): 'a0000000-0000-0000-0000-000000000001',
    ('dieng kulon', 'Kabupaten Banjarnegara'): 'a0000000-0000-0000-0000-000000000004',
    ('limbasari', 'Kabupaten Purbalingga'): 'a0000000-0000-0000-0000-000000000003',
    ('karangbanjar', 'Kabupaten Purbalingga'): 'a0000000-0000-0000-0000-000000000005',
    ('samiran', 'Kabupaten Boyolali'): 'a0000000-0000-0000-0000-000000000006',
    ('lerep', 'Kabupaten Semarang'): 'a0000000-0000-0000-0000-000000000007',
}

CATEGORY_MAP = {
    'Semen': 'MATERIAL_SEMEN',
    'Pasir': 'MATERIAL_AGREGAT',
    'Batu': 'MATERIAL_AGREGAT',
    'Besi': 'MATERIAL_LOGAM',
    'Kayu': 'MATERIAL_KAYU',
    'Atap': 'MATERIAL_ATAP',
    'Cat': 'BAHAN_KIMIA',
    'Keramik': 'MATERIAL_KERAMIK',
    'Pipa': 'MATERIAL_PIPA',
    'Sanitair': 'SANITASI_PLUMBING',
    'Beton': 'MATERIAL_BETON',
    'Upah': 'UPAH_TENAGA',
    'Lain-lain': 'MATERIAL_LAIN',
}

def normalize_regency(raw):
    s = (raw or '').strip()
    if s.startswith('Kab. '):
        s = 'Kabupaten ' + s[5:]
    elif s == 'Kab.Banjarnegara':
        s = 'Kabupaten Banjarnegara'
    return s

def slugify(text):
    s = re.sub(r'[^a-zA-Z0-9\s-]', '', text).lower().strip()
    return re.sub(r'[\s-]+', '-', s)

def escape_sql(text):
    if text is None:
        return 'NULL'
    return "'" + str(text).replace("'", "''") + "'"

def main():
    print(f"Loading {EXCEL_PATH}...")
    zf = zipfile.ZipFile(EXCEL_PATH)
    
    def get_sheet_rows(sheet_name):
        wb_tree = ET.fromstring(zf.read('xl/workbook.xml'))
        sheet_rId = None
        for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            if s.attrib['name'] == sheet_name:
                sheet_rId = s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
                break
        
        rels_tree = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
        target = None
        for r in rels_tree.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            if r.attrib['Id'] == sheet_rId:
                target = r.attrib['Target'].lstrip('/')
                break
        
        sheet_xml = ET.fromstring(zf.read(target))
        raw_rows = sheet_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
        rows_data = []
        for r in raw_rows:
            vals = []
            for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                is_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                v_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if is_elem is not None:
                    t = is_elem.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    vals.append(t.text if t is not None else '')
                elif v_elem is not None:
                    vals.append(v_elem.text or '')
                else:
                    vals.append('')
            rows_data.append(vals)
        return rows_data

    # 1. Parse Master Desa
    v_rows = get_sheet_rows('02-Master Desa Wisata')
    # header: desa_id, nama_desa, kabupaten_kota, kode_kab, latitude, longitude, sumber_koordinat, tahun_data, penerima_bankeu_2023, nominal_bankeu_2023, kecamatan, dana_desa_2025, kode_kemendagri, status_match_dd
    
    villages = []
    seen_slugs = set()
    used_ids = set()

    for idx, row in enumerate(v_rows[1:], start=1):
        desa_code = row[0].strip() if len(row) > 0 else f'DSW-{idx:04d}'
        name = row[1].strip() if len(row) > 1 else ''
        if not name:
            continue
        regency = normalize_regency(row[2] if len(row) > 2 else '')
        lat_str = row[4].strip() if len(row) > 4 else ''
        lon_str = row[5].strip() if len(row) > 5 else ''
        penerima_bankeu = (row[8].strip() if len(row) > 8 else '').lower() == 'ya'
        nominal_bankeu = float(row[9].strip()) if len(row) > 9 and row[9].strip().isdigit() else 0.0
        kecamatan = row[10].strip() if len(row) > 10 and row[10].strip() else f"Kecamatan {name}"
        dana_desa = float(row[11].strip()) if len(row) > 11 and row[11].strip().isdigit() else 0.0

        # Coordinates
        if lat_str and lon_str:
            try:
                lat = float(lat_str)
                lon = float(lon_str)
            except ValueError:
                c_lat, c_lon = REGENCY_CENTERS.get(regency, (-7.2, 110.2))
                lat, lon = c_lat + ((idx % 30) - 15) * 0.005, c_lon + (((idx * 7) % 30) - 15) * 0.005
        else:
            c_lat, c_lon = REGENCY_CENTERS.get(regency, (-7.2, 110.2))
            lat = c_lat + ((idx % 40) - 20) * 0.004
            lon = c_lon + (((idx * 11) % 40) - 20) * 0.004

        # ID mapping
        lookup_key = (name.lower(), regency)
        if lookup_key in KNOWN_DEMO_IDS:
            v_id = KNOWN_DEMO_IDS[lookup_key]
        else:
            v_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{desa_code}-{name}-{regency}"))

        # Unique slug
        base_slug = slugify(f"{name}-{regency.replace('Kabupaten ', '').replace('Kota ', '')}")
        slug = base_slug
        slug_idx = 2
        while slug in seen_slugs:
            slug = f"{base_slug}-{slug_idx}"
            slug_idx += 1
        seen_slugs.add(slug)

        category = 'MANDIRI' if nominal_bankeu >= 500000000 else ('MAJU' if nominal_bankeu > 0 else 'BERKEMBANG')
        trust_score = 92.5 if nominal_bankeu >= 500000000 else (85.0 if nominal_bankeu > 0 else 78.5)

        villages.append({
            'id': v_id,
            'code': desa_code,
            'name': f"Desa Wisata {name}",
            'slug': slug,
            'regency': regency,
            'district': kecamatan,
            'latitude': round(lat, 7),
            'longitude': round(lon, 7),
            'category': category,
            'pokdarwis_name': f"Pokdarwis {name} Maju",
            'contact_phone': f"0812{idx:08d}"[:13],
            'trust_score': trust_score,
            'penerima_bankeu': penerima_bankeu,
            'nominal_bankeu': nominal_bankeu,
            'dana_desa': dana_desa,
        })

    print(f"Total processed villages: {len(villages)}")

    # 2. Parse HSD Mas Petruk 2026
    hsd_rows = get_sheet_rows('20-HSD Mas Petruk 2026')
    # header: no, material_workbook, kategori, satuan, kabupaten_kota, nama_hsd, satuan_hsd, harga_hsd_2026, harga_min, catatan, sumber, status_data

    hsd_items = []
    seen_item_codes = set()
    for idx, row in enumerate(hsd_rows[1:], start=1):
        if len(row) < 8:
            continue
        material = row[1].strip()
        raw_cat = row[2].strip()
        unit = row[3].strip()
        regency = normalize_regency(row[4].strip())
        nama_hsd = row[5].strip() if len(row) > 5 else material
        
        try:
            price = float(row[7].strip())
        except (ValueError, TypeError):
            continue

        item_code = f"HSD-2026-{idx:04d}"
        category = CATEGORY_MAP.get(raw_cat, 'MATERIAL_FISIK')

        hsd_items.append({
            'item_code': item_code,
            'item_name': f"{material} ({nama_hsd})" if nama_hsd != material else material,
            'category': category,
            'unit': unit,
            'standard_price': price,
            'regency': regency,
            'effective_year': 2026,
            'sumber': 'MAS PETRUK DPUBinmarcipka Jateng 2026'
        })

    print(f"Total processed HSD items: {len(hsd_items)}")

    # 3. Save JSON Files for App / Fast Access
    os.makedirs('data', exist_ok=True)
    with open('data/master-desa-867.json', 'w', encoding='utf-8') as f:
        json.dump(villages, f, indent=2, ensure_ascii=False)
    with open('data/hsd-maspetruk-1061.json', 'w', encoding='utf-8') as f:
        json.dump(hsd_items, f, indent=2, ensure_ascii=False)
    print("Saved data/master-desa-867.json and data/hsd-maspetruk-1061.json")

    # 4. Generate SQL Seeds
    # A. tourist_villages + village_grants
    sql_v_lines = [
        "-- ==============================================================================",
        "-- DEWI JATENG - SEED 867 DESA WISATA & 119 BANKEU PENERIMA (DATA RIIL JATENG)",
        "-- ==============================================================================",
        ""
    ]
    
    # Chunk village inserts into batches of 100
    for i in range(0, len(villages), 100):
        chunk = villages[i:i+100]
        vals = []
        for v in chunk:
            vals.append(
                f"({escape_sql(v['id'])}, {escape_sql(v['slug'])}, {escape_sql(v['name'])}, "
                f"{escape_sql(v['regency'])}, {escape_sql(v['district'])}, {v['latitude']}, {v['longitude']}, "
                f"{escape_sql(v['category'])}, {escape_sql(v['pokdarwis_name'])}, {escape_sql(v['contact_phone'])}, "
                f"{v['trust_score']})"
            )
        sql_v_lines.append(
            f"INSERT INTO tourist_villages (id, slug, name, regency, district, latitude, longitude, category, pokdarwis_name, contact_phone, trust_score)\nVALUES\n"
            + ",\n".join(vals)
            + "\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, regency = EXCLUDED.regency, trust_score = EXCLUDED.trust_score;\n"
        )

    # Trigger PostGIS update
    sql_v_lines.append("UPDATE tourist_villages SET updated_at = CURRENT_TIMESTAMP WHERE geom IS NULL;\n")

    # Grants for bankeu recipients
    grant_vals = []
    for idx, v in enumerate(villages, start=1):
        if v['penerima_bankeu'] and v['nominal_bankeu'] > 0:
            grant_id = f"b{idx:07d}-0000-0000-0000-000000000000"[:36]
            alloc = v['nominal_bankeu']
            realized = alloc * 0.85
            remaining = alloc - realized
            grant_vals.append(
                f"({escape_sql(grant_id)}, {escape_sql(v['id'])}, 2026, 'Bantuan Keuangan Sarpras Pariwisata Pemprov Jateng', "
                f"{alloc:.2f}, {realized:.2f}, {remaining:.2f}, '/documents/lpj-{v['slug']}-2026.pdf', 'VERIFIED', CURRENT_TIMESTAMP - INTERVAL '5 days')"
            )

    for i in range(0, len(grant_vals), 50):
        chunk = grant_vals[i:i+50]
        sql_v_lines.append(
            "INSERT INTO village_grants (id, village_id, fiscal_year, funding_source, total_allocated, total_realized, remaining_balance, lpj_document_url, lpj_status, uploaded_at)\nVALUES\n"
            + ",\n".join(chunk)
            + "\nON CONFLICT (village_id, fiscal_year) DO UPDATE SET total_allocated = EXCLUDED.total_allocated;\n"
        )

    with open('docker/seed-villages-867.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_v_lines))
    print(f"Generated docker/seed-villages-867.sql ({len(villages)} desa, {len(grant_vals)} grants)")

    # B. HSD MAS PETRUK 2026 SQL
    sql_hsd_lines = [
        "-- ==============================================================================",
        "-- DEWI JATENG - SEED 1.061 HARGA SATUAN DASAR (HSD) MAS PETRUK 2026 PEMPROV JATENG",
        "-- ==============================================================================",
        ""
    ]
    for i in range(0, len(hsd_items), 100):
        chunk = hsd_items[i:i+100]
        vals = []
        for h in chunk:
            vals.append(
                f"({escape_sql(h['item_code'])}, {escape_sql(h['item_name'])}, {escape_sql(h['category'])}, "
                f"{escape_sql(h['unit'])}, {h['standard_price']:.2f}, {escape_sql(h['regency'])}, {h['effective_year']})"
            )
        sql_hsd_lines.append(
            "INSERT INTO ssh_reference_rates (item_code, item_name, category, unit, standard_price, regency, effective_year)\nVALUES\n"
            + ",\n".join(vals)
            + "\nON CONFLICT (item_code) DO UPDATE SET standard_price = EXCLUDED.standard_price;\n"
        )

    with open('docker/seed-hsd-2026.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_hsd_lines))
    print(f"Generated docker/seed-hsd-2026.sql ({len(hsd_items)} HSD acuan harga)")

if __name__ == '__main__':
    main()
