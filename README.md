# Global Population & Demographic Change Explorer

An interactive, responsive Big Data Visualization dashboard developed with **pure HTML5, CSS3, JavaScript, and D3.js (v7)**. This application visualizes historical demographic shifts, age composition changes, and population trajectories across **237 countries and 6 continents** from **1950 to 2023** using authentic United Nations demographic statistics.

---

## 1. Project Title
**Global Population & Demographic Change Explorer**  
*Interactive D3.js Visualization of Long-Term Demographic Transitions (1950 – 2023)*

- **Course:** 21CSE423T — Big Data Visualization
- **Focus Area:** Multi-dimensional demographic analysis, coordinated views, temporal transitions, and quantitative data exploration.

---

## 2. Assignment Description
This project satisfies the coursework requirements for **21CSE423T: Big Data Visualization**. The assignment entails developing an interactive data visualization platform in D3.js to analyze:
1. Long-term global population growth trajectories.
2. Age distribution across demographic cohorts.
3. Demographic transitions from high youth dependency to working-age dividend and aging societies.
4. Comparative rankings across countries and continental aggregations.
5. Longitudinal changes across 74 historical years (1950–2023).

---

## 3. Project Objectives
- **Data Engineering:** Preprocess multi-cohort UN population records into an indexed, normalized format with accurate ISO country-to-continent regional mappings.
- **Interactive Multi-View Coordination:** Synchronize a responsive horizontal bar chart, a multi-layer stacked area chart, and summary KPI cards.
- **D3.js Methodological Rigor:** Apply core D3.js concepts including scale transformations (`scaleBand`, `scaleLinear`), stack generators (`d3.stack`), area generators (`d3.area`), animated transitions (`d3.transition`), and dynamic rollup aggregations (`d3.rollup`, `d3.group`).
- **Academically Defensible Analysis:** Dynamically generate factual observations without hardcoded statistics, demonstrating demographic transitions (youth-oriented, dividend windows, and super-aging societies).

---

## 4. Dataset Source & Attribution
The project uses authentic demographic statistics compiled from the **United Nations Department of Economic and Social Affairs, Population Division — World Population Prospects (2024 Revision)**, accessed via Our World in Data (OWID):

- **Primary Source:** United Nations World Population Prospects (WPP 2024)
- **Data Distributor:** Our World in Data (OWID)
- **Direct Dataset URL:** `https://ourworldindata.org/grapher/population-by-age-group.csv`
- **ISO 3166-1 Regional Mapping:** United Nations Statistics Division (UN M49) via ISO-3166 country classification (`https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes`)

> [!NOTE]
> No fake, simulated, or randomized population data is used. Every metric reflects official UN demographic estimates.

---

## 5. Dataset Structure

### A. Raw Dataset (`data/raw_population_by_age.csv`)
Downloaded directly from OWID:
- `Entity`: Country or regional entity name (e.g., Afghanistan, India, World)
- `Code`: ISO alpha-3 code or OWID aggregate prefix (e.g., AFG, IND, OWID_WRL)
- `Year`: Observation year (1950 to 2023)
- `Under-5s`: Population aged 0–4 years
- `Ages 5-14`: Population aged 5–14 years
- `Ages 15-24`: Population aged 15–24 years
- `Ages 25-64`: Population aged 25–64 years
- `Ages 65+`: Population aged 65 years and older

### B. Cleaned Assignment Dataset (`data/demographic.csv`)
Preprocessed by `scripts/preprocess.py` into a standardized long format:

| Column | Type | Description | Sample Value |
|---|---|---|---|
| `country` | String | Standard country / territory name | `India` |
| `code` | String | ISO 3166-1 alpha-3 code | `IND` |
| `continent` | String | Continental grouping (Africa, Asia, Europe, North America, Oceania, South America) | `Asia` |
| `year` | Integer | Observation year (1950 – 2023) | `2023` |
| `age_group` | String | Demographic cohort (`Under 5`, `5-14`, `15-24`, `25-64`, `65+`) | `25-64` |
| `population` | Integer | Absolute population count | `720314435` |

- **Total Records:** 87,690 rows (237 countries × 74 years × 5 cohorts)
- **File Size:** ~3.45 MB (loads and parses in ~35 ms in modern browsers)

---

## 6. Technologies Used
- **D3.js v7.9.0:** Data visualization, SVG coordinate mapping, scale generators, stack geometry, transitions, and DOM data binding.
- **HTML5:** Semantic markup, accessible labels (`aria-*`), native control elements.
- **CSS3:** Responsive CSS Grid, Flexbox, custom range sliders, drop shadows, and colorblind-accessible categorical palettes.
- **Vanilla JavaScript (ES6+):** In-memory indexing, cross-filtering, timeline animation, URL deep-linking.
- **Python 3:** Preprocessing pipeline (`scripts/preprocess.py`) for data validation and ISO mapping.

> [!IMPORTANT]
> This project contains **no React, Angular, Vue, Next.js, TypeScript, Node backend, MongoDB, or PostgreSQL**. It is engineered purely with native browser technologies and D3.js v7.

---

## 7. Project Structure

```
big-data-visualization/
│
├── index.html                  # Main dashboard markup and semantic structure
├── README.md                   # Comprehensive documentation and project guide
├── REPORT.md                   # Formal academic brief report
├── PRESENTATION.md             # Viva presentation slides and Q&A guide
│
├── css/
│   └── style.css               # Clean, responsive stylesheet with design tokens
│
├── js/
│   ├── app.js                  # D3.js visualization logic, scales, and interactions
│   └── d3.v7.min.js            # Standalone D3.js v7 library for offline reliability
│
├── data/
│   ├── demographic.csv         # Clean assignment dataset (87,690 records)
│   ├── raw_population_by_age.csv # Original OWID source CSV
│   └── iso_countries.csv       # UN/ISO 3166-1 regional classification reference
│
├── scripts/
│   └── preprocess.py           # Automated, reproducible preprocessing script
│
└── screenshots/                # Visual verification and submission graphics
    ├── 01_dashboard_overview_2023.png
    ├── 02_continent_africa_2023.png
    ├── 03_stacked_area_percentage_mode.png
    ├── 04_country_japan_super_aging.png
    └── 05_historical_year_1970.png
```

---

## 8. Visualization Description

### Chart 1: Population by Country (Interactive Bar Chart)
- **Purpose:** Compares population sizes across countries for a selected year and continental boundary.
- **Design:** Horizontal orientation prevents truncation of lengthy country names.
- **Scales:**
  - `d3.scaleBand()`: Maps country names to vertical bar slots with 24% inner padding.
  - `d3.scaleLinear()`: Maps population to pixel widths with responsive bounds.
- **Data Lifecycle:** Employs D3 `.join()` pattern (`enter`, `update`, `exit`) with `.transition().duration(500)` for smooth bar height/width animations on year or filter shifts.
- **Highlighting:** When a specific country is chosen, its bar dynamically receives a distinct warm amber highlight (`#d97706`) and bold styling.
- **Cross-Filtering:** Clicking any bar or Y-axis label immediately selects that country, updating the stacked area chart and KPI cards.

### Chart 2: Age Distribution Over Time (Stacked Area Chart)
- **Purpose:** Visualizes demographic progression and cohort transitions from 1950 to 2023.
- **Default Focus:** **India** (sensible default country as specified in assignment requirements).
- **Scales:**
  - `d3.scaleLinear()`: Maps timeline years (1950 – 2023) horizontally.
  - `d3.scaleLinear()`: Maps cumulative population vertically (or 0–100% in normalized mode).
- **Stack & Area Generators:**
  - `d3.stack().keys(['Under 5', '5-14', '15-24', '25-64', '65+'])` generates upper and lower baseline coordinate pairs (`y0`, `y1`).
  - `d3.area().curve(d3.curveMonotoneX)` generates smooth cubic Bezier paths.
- **Modes:**
  - **Absolute:** Displays total population in millions/billions.
  - **Share (%):** 100% normalized view illustrating demographic transition stages (e.g., shrinking youth, expanding elderly).
- **Timeline Crosshair:** A vertical dashed line indicates the selected year on the slider. Hovering across the chart activates a live crosshair and detailed demographic cohort breakdown. Clicking anywhere on the chart jumps the timeline slider to that year.

---

## 9. Interactive Features
1. **Continent Dropdown:** Filters the bar chart and country list across all 6 continents (Africa, Asia, Europe, North America, Oceania, South America).
2. **Dynamic Country Dropdown:** Updates options based on the chosen continent; includes an "All Countries" top rankings option.
3. **Year Slider:** Smooth scrub across 74 years (1950 to 2023) with live year badge.
4. **Play / Pause Timeline Controller:** Animates the dashboard forward year-by-year, allowing live demonstration of demographic momentum.
5. **Metric Toggle (Absolute vs Share %):** Normalizes the stacked area chart to 100% to examine cohort composition.
6. **Interactive Age Legend:** Hovering over any age cohort in the legend highlights that layer in the stacked area chart while dimming non-target cohorts.
7. **Bar Chart Click-to-Focus:** Clicking any bar focuses that country in the stacked area chart and updates the dropdown.
8. **Area Chart Click-to-Year:** Clicking any point on the area timeline immediately sets the year slider.
9. **Reset Button:** Restores all filters, metrics, and timeline positions to default states.
10. **Rich Dual Tooltips:** Hovering over bars or area charts reveals formatted population counts, percentages, and comparative context.
11. **URL Deep-Linking:** Supports URL parameters (e.g., `?continent=Africa`, `?country=Japan&mode=pct`, `?year=1970`).

---

## 10. How to Run the Project

### Method 1: VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**:
   ```sh
   code /Users/rahulseervi/Documents/GitHub/big-data-visualization
   ```
2. Ensure the **Live Server** extension (by Ritwick Dey) is installed.
3. Right-click [`index.html`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/index.html) in the Explorer and select **"Open with Live Server"**.
4. The dashboard will automatically launch at `http://127.0.0.1:5500/index.html`.

### Method 2: Python Simple HTTP Server
Open your terminal in the workspace directory and execute:
```sh
# Python 3
python3 -m http.server 8000
```
Then navigate to:
```
http://localhost:8000
```

### Method 3: Node.js http-server / npx
```sh
npx http-server -p 8000
```

> [!NOTE]
> Browsers restrict fetching local CSV files directly via `file:///` due to Cross-Origin (CORS) security restrictions. Running via a local HTTP server as described above is required.

---

## 11. Expected Output & Screenshots

The project includes pre-rendered, high-resolution screenshots generated in headless Chrome under [`screenshots/`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/screenshots/):

1. **[`01_dashboard_overview_2023.png`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/screenshots/01_dashboard_overview_2023.png):**  
   Global overview in 2023 showing 8.09B global population, India and China at 1.4B+, and India's stacked age progression.
2. **[`02_continent_africa_2023.png`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/screenshots/02_continent_africa_2023.png):**  
   Filtered to Africa (1.48B), showing Nigeria as the population leader (227.88M) and a youthful demographic profile (39.4% aged 0–14).
3. **[`03_stacked_area_percentage_mode.png`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/screenshots/03_stacked_area_percentage_mode.png):**  
   100% normalized demographic transition showing India's working-age expansion from 55% in 1970 to 68% in 2023.
4. **[`04_country_japan_super_aging.png`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/screenshots/04_country_japan_super_aging.png):**  
   Japan case study showing super-aging transition (65+ cohort reaching 29.5% in 2023 vs 4.9% in 1950).
5. **[`05_historical_year_1970.png`](file:///Users/rahulseervi/Documents/GitHub/big-data-visualization/screenshots/05_historical_year_1970.png):**  
   Historical 1970 baseline (3.69B world population) with China as the global leader (823.31M).

---

## 12. Academic Notes & Viva Preparation

### Key D3.js Concepts Implemented
- **Data Joins:** Used `.data(displayData, d => d.country).join(enter => ..., update => ..., exit => ...)` to preserve object constancy and prevent re-creating DOM nodes unnecessarily.
- **Scale Mapping:**
  - `d3.scaleBand()` maps discrete categorical strings to spatial bands.
  - `d3.scaleLinear()` maps continuous demographic quantities to visual dimensions.
- **Stack Calculations:** `d3.stack()` accumulates values across cohorts into coordinate intervals `[y0, y1]`, enabling layered rendering.
- **Aggregation:** In-memory aggregations mirror `d3.rollup()` and `d3.group()` paradigms to aggregate 87,690 data points dynamically without a backend server.
- **Interpolation:** `d3.curveMonotoneX` prevents overshoot in temporal population curves, maintaining demographic validity.

### Questions Frequently Asked in Viva
1. **Why use horizontal bars instead of vertical bars?**  
   *Answer:* Country labels (such as "Democratic Republic of Congo") are lengthy. Vertical bar charts force slanted or truncated text, impairing readability. Horizontal bars allow comfortable typography and natural top-to-bottom ranking.
2. **How does the percentage toggle work mathematically?**  
   *Answer:* Each cohort value $C_i$ for a given year is normalized by the total population $T = \sum_{k=1}^5 C_k$, computing $P_i = (C_i / T) \times 100$. The Y-scale domain is set to $[0, 100]$, transforming the visualization into a 100% proportional area chart.
3. **How is responsiveness achieved without external UI frameworks?**  
   *Answer:* SVG `viewBox` attributes define a virtual coordinate space, while `ResizeObserver` / window resize event listeners trigger responsive recalculations of `innerWidth` and `innerHeight` dynamically.
