#!/usr/bin/env python3
"""
Demographic Data Preprocessing Script
======================================
Course: 21CSE423T - Big Data Visualization
Project: Global Population Growth and Demographic Change Visualization

Source:
  - United Nations World Population Prospects (2024 Revision)
  - Distributed via Our World in Data (OWID):
    https://ourworldindata.org/grapher/population-by-age-group.csv
  - ISO 3166-1 Regional Classification:
    https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes

Output:
  - data/demographic.csv: Clean long-format demographic dataset containing
    country, code, continent, year, age_group, population.
"""

import csv
import os
import sys

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_csv = os.path.join(base_dir, 'data', 'raw_population_by_age.csv')
    iso_csv = os.path.join(base_dir, 'data', 'iso_countries.csv')
    out_csv = os.path.join(base_dir, 'data', 'demographic.csv')

    if not os.path.exists(raw_csv):
        print(f"Error: Raw CSV not found at {raw_csv}")
        sys.exit(1)

    # 1. Load ISO 3166 regional mapping
    iso_map = {}
    if os.path.exists(iso_csv):
        with open(iso_csv, 'r', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                iso_map[row['alpha-3']] = row

    def get_continent(alpha3, entity_name):
        # Explicit mappings for territories not in standard ISO file
        if entity_name == 'Kosovo' or alpha3 == 'OWID_KOS':
            return 'Europe'
        if entity_name == 'Taiwan' or alpha3 == 'TWN':
            return 'Asia'
        
        if alpha3 in iso_map:
            info = iso_map[alpha3]
            region = info.get('region', '')
            intermediate = info.get('intermediate-region', '')
            if region == 'Africa':
                return 'Africa'
            if region == 'Asia':
                return 'Asia'
            if region == 'Europe':
                return 'Europe'
            if region == 'Oceania':
                return 'Oceania'
            if region == 'Americas':
                if intermediate == 'South America':
                    return 'South America'
                return 'North America'
        return None

    def is_country_entity(code):
        # Exclude aggregate groupings such as UN_AFR, OWID_WRL, etc.
        # Country codes are 3 uppercase letters, plus OWID_KOS for Kosovo
        return (len(code) == 3 and code.isupper() and not code.startswith('UN_') and not code.startswith('OWID')) or code == 'OWID_KOS'

    # Age group mapping: (clean_label, source_column)
    age_groups = [
        ('Under 5', 'Under-5s'),
        ('5-14', 'Ages 5-14'),
        ('15-24', 'Ages 15-24'),
        ('25-64', 'Ages 25-64'),
        ('65+', 'Ages 65+')
    ]

    print("Reading raw demographic dataset...")
    rows_processed = 0
    records = []

    with open(raw_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            code = r['Code'].strip()
            entity = r['Entity'].strip()

            if not is_country_entity(code):
                continue

            continent = get_continent(code, entity)
            if not continent:
                continue

            try:
                year = int(r['Year'])
            except (ValueError, TypeError):
                continue

            # Standardize Kosovo code
            iso_code = 'KOS' if code == 'OWID_KOS' else code

            for label, col in age_groups:
                try:
                    pop = int(float(r[col]))
                except (ValueError, TypeError, KeyError):
                    pop = 0

                records.append({
                    'country': entity,
                    'code': iso_code,
                    'continent': continent,
                    'year': year,
                    'age_group': label,
                    'population': pop
                })
            rows_processed += 1

    print(f"Processed {rows_processed} country-year rows into {len(records)} age-group records.")

    # Write cleaned CSV
    print(f"Writing clean dataset to {out_csv}...")
    fieldnames = ['country', 'code', 'continent', 'year', 'age_group', 'population']
    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    file_size_mb = os.path.getsize(out_csv) / (1024 * 1024)
    print(f"Success! {out_csv} created ({file_size_mb:.2f} MB).")

if __name__ == '__main__':
    main()
