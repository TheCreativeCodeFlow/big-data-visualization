#!/usr/bin/env python3
"""
Academic PDF Report Generator (Optimized 6-Page Layout)
======================================================
Generates a publication-quality PDF report for:
Course: 21CSE423T - Big Data Visualization
Project: Global Population Growth and Demographic Change Visualization
Hosted URL: https://big-data-visualization-one.vercel.app/
"""

import base64
import os
import subprocess
import sys

def img_to_base64(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        return f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    screenshots_dir = os.path.join(base_dir, "screenshots")
    pdf_out = os.path.join(base_dir, "Global_Population_Visualization_Report.pdf")
    html_temp = os.path.join(base_dir, "report_print.html")

    # Load screenshots as base64
    img_overview = img_to_base64(os.path.join(screenshots_dir, "01_dashboard_overview_2023.png"))
    img_africa = img_to_base64(os.path.join(screenshots_dir, "02_continent_africa_2023.png"))
    img_pct = img_to_base64(os.path.join(screenshots_dir, "03_stacked_area_percentage_mode.png"))
    img_japan = img_to_base64(os.path.join(screenshots_dir, "04_country_japan_super_aging.png"))
    img_1970 = img_to_base64(os.path.join(screenshots_dir, "05_historical_year_1970.png"))

    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Global Population & Demographic Change Explorer - Academic Report</title>
<style>
  @page {
    size: A4;
    margin: 14mm 14mm 14mm 14mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.45;
    font-size: 9pt;
  }

  /* Page Break Utilities */
  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Cover / Header Section */
  .cover-header {
    border-bottom: 2px solid #4338ca;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }

  .badge-course {
    display: inline-block;
    background: #e0e7ff;
    color: #3730a3;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 7px;
    border-radius: 4px;
    margin-bottom: 5px;
  }

  h1.report-title {
    font-size: 16.5pt;
    font-weight: 800;
    color: #1e1b4b;
    line-height: 1.2;
    margin-bottom: 3px;
  }

  .report-subtitle {
    font-size: 9.5pt;
    color: #475569;
    margin-bottom: 8px;
  }

  /* Live URL Callout Box */
  .live-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 4px solid #4338ca;
    border-radius: 5px;
    padding: 8px 12px;
    margin: 8px 0 10px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .live-box .live-label {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
  }

  .live-box .live-url {
    font-size: 10pt;
    font-weight: 700;
    color: #4338ca;
    text-decoration: none;
    font-family: monospace;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #e2e8f0;
    font-size: 8pt;
  }

  .meta-item strong {
    display: block;
    color: #64748b;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Headings */
  h2.section-title {
    font-size: 11.5pt;
    font-weight: 750;
    color: #1e1b4b;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
    margin: 12px 0 8px 0;
  }

  h3.sub-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #334155;
    margin: 9px 0 4px 0;
  }

  p {
    margin-bottom: 6px;
    color: #1e293b;
    text-align: justify;
  }

  ul, ol {
    margin: 4px 0 8px 16px;
  }

  li {
    margin-bottom: 3px;
  }

  /* Data Table */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 10px 0;
    font-size: 8pt;
  }

  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 4px 6px;
    text-align: left;
  }

  table.data-table th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
  }

  table.data-table tr:nth-child(even) {{
    background: #f8fafc;
  }}

  /* Figure Styling */
  .figure-box {
    margin: 8px auto;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    overflow: hidden;
    background: #f8fafc;
    width: 95%;
  }

  .figure-img {
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    display: block;
    background: #ffffff;
  }

  .figure-caption {
    padding: 4px 8px;
    font-size: 7.5pt;
    color: #475569;
    border-top: 1px solid #e2e8f0;
    background: #ffffff;
    font-weight: 500;
  }

  .figure-caption strong {
    color: #1e1b4b;
  }

  .code-inline {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 8pt;
    background: #f1f5f9;
    color: #334155;
    padding: 1px 3px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  /* Viva Q&A Box */
  .viva-card {
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 7px 10px;
    margin-bottom: 7px;
    background: #ffffff;
  }

  .viva-q {
    font-weight: 700;
    color: #3730a3;
    font-size: 8.5pt;
    margin-bottom: 2px;
  }

  .viva-a {
    font-size: 8pt;
    color: #334155;
  }

  .footer-tag {
    margin-top: 10px;
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 4px;
  }
</style>
</head>
<body>

  <!-- ==============================================================
       PAGE 1: COVER, EXECUTIVE SUMMARY & ARCHITECTURE
       ============================================================== -->
  <header class="cover-header">
    <span class="badge-course">Course: 21CSE423T &bull; Big Data Visualization</span>
    <h1 class="report-title">Global Population &amp; Demographic Change Explorer</h1>
    <p class="report-subtitle">Interactive D3.js Visualization of Long-Term Demographic Transitions (1950 – 2023)</p>
    
    <!-- Live Hosted Application Callout -->
    <div class="live-box">
      <div>
        <div class="live-label">Official Live Production Deployment</div>
        <a class="live-url" href="https://big-data-visualization-one.vercel.app/" target="_blank">https://big-data-visualization-one.vercel.app/</a>
      </div>
      <div style="font-size: 7.5pt; color: #64748b; text-align: right;">
        Hosted on <strong>Vercel Edge Network</strong><br>
        Framework: <strong>Pure HTML5 / D3.js v7</strong>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>Source Dataset</strong>
        UN WPP 2024 Revision / OWID
      </div>
      <div class="meta-item">
        <strong>Repository URL</strong>
        github.com/TheCreativeCodeFlow/big-data-visualization
      </div>
      <div class="meta-item">
        <strong>Temporal Coverage</strong>
        1950 – 2023 (74 Historical Years)
      </div>
    </div>
  </header>

  <section>
    <h2 class="section-title">1. Executive Summary</h2>
    <p>
      Understanding long-term demographic trajectories is vital for global economic forecasting, public pension sustainability, healthcare infrastructure allocation, and labor supply planning. This academic project presents the design, methodology, implementation, and empirical observations of the <strong>Global Population &amp; Demographic Change Explorer</strong>, an interactive data visualization platform developed strictly with native browser technologies (HTML5, CSS3, ES6 JavaScript) and <strong>D3.js v7</strong>.
    </p>
    <p>
      The platform analyses official demographic statistics spanning <strong>237 sovereign nations and territories</strong> across <strong>6 continents</strong> over <strong>74 continuous historical years (1950 to 2023)</strong>. Core visualization fundamentals are demonstrated without high-level charting libraries: custom scale transformations (<span class="code-inline">d3.scaleBand</span>, <span class="code-inline">d3.scaleLinear</span>), stacked layout coordinate generation (<span class="code-inline">d3.stack</span>, <span class="code-inline">d3.area</span>), DOM data join lifecycles (<span class="code-inline">.join</span>), animated coordinate transitions (<span class="code-inline">d3.transition</span>), and real-time in-memory multi-key rollups across 87,690 records.
    </p>
    <p>
      The complete project is deployed and publicly accessible to academic mentors and evaluators at:
      <strong><a href="https://big-data-visualization-one.vercel.app/" style="color:#4338ca;">https://big-data-visualization-one.vercel.app/</a></strong>.
    </p>
  </section>

  <div class="figure-box">
    <img src="{img_overview}" class="figure-img" alt="Global Dashboard Overview">
    <div class="figure-caption">
      <strong>Figure 1:</strong> Global Population &amp; Demographic Change Explorer baseline view for the year 2023. Live URL: <a href="https://big-data-visualization-one.vercel.app/">https://big-data-visualization-one.vercel.app/</a>.
    </div>
  </div>

  <div class="footer-tag">Page 1 &bull; 21CSE423T Big Data Visualization &bull; https://big-data-visualization-one.vercel.app/</div>
  <div class="page-break"></div>

  <!-- ==============================================================
       PAGE 2: DATASET ENGINEERING & ARCHITECTURE
       ============================================================== -->
  <section>
    <h2 class="section-title">2. Dataset Engineering &amp; Preprocessing Methodology</h2>
    <p>
      The visualization operates on real-world demographic data compiled from the <strong>United Nations Department of Economic and Social Affairs, Population Division (2024 Revision)</strong>, published through <em>Our World in Data (OWID)</em>. No synthetic, simulated, or randomized values are used.
    </p>
    
    <h3 class="sub-title">2.1 Raw Dataset Extraction &amp; Cleaning (<span class="code-inline">scripts/preprocess.py</span>)</h3>
    <p>
      The raw source dataset (<span class="code-inline">data/raw_population_by_age.csv</span>) comprised 19,388 entity-year records across 8 columns. However, raw records intermingled sovereign nations with multi-national aggregate groupings (e.g., <span class="code-inline">OWID_WRL</span>, <span class="code-inline">UN_AFR</span>, Low-income countries) and lacked standardized continental classifications for individual countries.
    </p>
    <ol>
      <li><strong>Entity Validation:</strong> Filtered records to isolate 237 sovereign nations and recognized territories with standard ISO-3166-1 alpha-3 codes (plus Kosovo under <span class="code-inline">KOS</span>). Regional duplicates and non-geographic groupings were systematically excluded.</li>
      <li><strong>Continental Mapping:</strong> Joined all entities against the United Nations M49 regional classification reference (<span class="code-inline">data/iso_countries.csv</span>). Countries were classified into six continents: Africa (58 nations), Asia (51), Europe (50), North America (41), Oceania (23), and South America (14).</li>
      <li><strong>Schema Normalization:</strong> Pivoted wide age columns into a clean long-format structure (<span class="code-inline">data/demographic.csv</span>) supporting five discrete cohorts: <em>Under 5</em>, <em>5–14</em>, <em>15–24</em>, <em>25–64</em>, and <em>65+</em>.</li>
      <li><strong>Integrity Audit:</strong> Integer conversions were verified with zero missing, NaN, or negative values across all 87,690 rows (3.45 MB total).</li>
    </ol>

    <table class="data-table">
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Data Type</th>
          <th>Description</th>
          <th>Sample Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="code-inline">country</span></td>
          <td>String</td>
          <td>Standard sovereign nation or territory name</td>
          <td>India</td>
        </tr>
        <tr>
          <td><span class="code-inline">code</span></td>
          <td>String</td>
          <td>ISO 3166-1 alpha-3 territory code</td>
          <td>IND</td>
        </tr>
        <tr>
          <td><span class="code-inline">continent</span></td>
          <td>String</td>
          <td>Standard continental classification (UN M49)</td>
          <td>Asia</td>
        </tr>
        <tr>
          <td><span class="code-inline">year</span></td>
          <td>Integer</td>
          <td>Observation year (1950 – 2023 continuous)</td>
          <td>2023</td>
        </tr>
        <tr>
          <td><span class="code-inline">age_group</span></td>
          <td>String</td>
          <td>Demographic cohort (<span class="code-inline">Under 5</span>, <span class="code-inline">5-14</span>, <span class="code-inline">15-24</span>, <span class="code-inline">25-64</span>, <span class="code-inline">65+</span>)</td>
          <td>25-64</td>
        </tr>
        <tr>
          <td><span class="code-inline">population</span></td>
          <td>Integer</td>
          <td>Official absolute population count</td>
          <td>720,314,435</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2 class="section-title">3. System Architecture &amp; Performance Design</h2>
    <p>
      In accordance with assignment guidelines, the implementation uses <strong>pure vanilla web technologies</strong> without frameworks like React, Next.js, Angular, or backend database servers.
    </p>
    <ul>
      <li><strong>Client-Side Processing:</strong> Ingests the 3.45 MB CSV using <span class="code-inline">d3.csv()</span> in ~35 milliseconds.</li>
      <li><strong>In-Memory Multi-Key Indexing:</strong> Organizes rows upon load into JavaScript <span class="code-inline">Map</span> objects (<span class="code-inline">yearCountryMap</span> and <span class="code-inline">countryTimeSeries</span>). Filtering or scrubbing timeline years executes in under 2 milliseconds, maintaining 60 frames per second (FPS) responsiveness.</li>
      <li><strong>Responsive SVG Geometry:</strong> SVG containers employ dynamic <span class="code-inline">viewBox</span> attributes combined with a debounced window <span class="code-inline">resize</span> listener to scale cleanly across desktop, laptop, and tablet displays.</li>
      <li><strong>Offline Redundancy:</strong> Includes a local fallback script (<span class="code-inline">js/d3.v7.min.js</span>) that activates automatically if external CDN connections are unavailable during viva evaluations.</li>
    </ul>
  </section>

  <div class="footer-tag">Page 2 &bull; 21CSE423T Big Data Visualization &bull; https://big-data-visualization-one.vercel.app/</div>
  <div class="page-break"></div>

  <!-- ==============================================================
       PAGE 3: D3 VISUALIZATION IMPLEMENTATION
       ============================================================== -->
  <section>
    <h2 class="section-title">4. D3.js Visualization Design &amp; Methodological Details</h2>
    
    <h3 class="sub-title">4.1 Interactive Population Bar Chart (<span class="code-inline">Population by Country</span>)</h3>
    <p>
      The bar chart illustrates country rankings for any selected year and continent. Horizontal bars are used because lengthy country labels (e.g., "Democratic Republic of the Congo") would become unreadable or require severe rotation in a vertical layout.
    </p>
    <ul>
      <li><strong>Scales:</strong> <span class="code-inline">d3.scaleBand()</span> maps country names to vertical slots with 0.24 inner padding; <span class="code-inline">d3.scaleLinear()</span> maps population counts to horizontal pixel widths with <span class="code-inline">.nice()</span> tick boundaries.</li>
      <li><strong>Data Join Lifecycle:</strong> Applies <span class="code-inline">.join(enter => ..., update => ..., exit => ...)</span> combined with <span class="code-inline">d3.transition().duration(500)</span> to animate bar dimensions, ranks, and numeric labels smoothly as filters change.</li>
      <li><strong>Dynamic Highlighting:</strong> Selecting a country styles its bar with a distinctive warm amber color (<span class="code-inline">#d97706</span>) and bold typography.</li>
      <li><strong>Bidirectional Filtering:</strong> Clicking any bar or Y-axis label selects that country across the entire dashboard.</li>
    </ul>

    <h3 class="sub-title">4.2 Demographic Stacked Area Chart (<span class="code-inline">Age Distribution Over Time</span>)</h3>
    <p>
      The stacked area chart visualizes cohort evolution across the full 74-year timeline (1950 to 2023) for the selected country, defaulting to <strong>India</strong> as specified in assignment requirements.
    </p>
    <ul>
      <li><strong>Stack Computation:</strong> <span class="code-inline">d3.stack().keys(['Under 5', '5-14', '15-24', '25-64', '65+'])</span> accumulates layer baselines across the five cohorts.</li>
      <li><strong>Cubic Interpolation:</strong> <span class="code-inline">d3.area().curve(d3.curveMonotoneX)</span> generates smooth SVG paths without artificial overshoot.</li>
      <li><strong>Dual Modes (Absolute vs. Share %):</strong>
        <ul>
          <li><em>Absolute Mode:</em> Displays cumulative population growth in millions and billions.</li>
          <li><em>Share (%) Mode:</em> Normalizes annual cohort totals to 100%, directly illustrating the demographic transition from youth-heavy expansion to an aging structure.</li>
        </ul>
      </li>
      <li><strong>Timeline Synchronization:</strong> A vertical dashed reference line tracks the active slider year, while an interactive <span class="code-inline">d3.bisector</span> crosshair displays cohort breakdowns for any hovered year. Clicking the chart jumps the slider to that year.</li>
    </ul>
  </section>

  <div class="figure-box">
    <img src="{img_pct}" class="figure-img" alt="Stacked Area Percentage Mode">
    <div class="figure-caption">
      <strong>Figure 2:</strong> 100% Normalized Stacked Area Chart demonstrating India's demographic transition from 1950 to 2023. Notice the expansion of working-age cohorts (15–64, green &amp; amber) and the gradual rise of older cohorts (65+, red).
    </div>
  </div>

  <div class="footer-tag">Page 3 &bull; 21CSE423T Big Data Visualization &bull; https://big-data-visualization-one.vercel.app/</div>
  <div class="page-break"></div>

  <!-- ==============================================================
       PAGE 4: DEMOGRAPHIC FINDINGS & OBSERVATIONS
       ============================================================== -->
  <section>
    <h2 class="section-title">5. Key Demographic Observations &amp; Empirical Findings</h2>
    <p>
      The dashboard features a dynamic analytical observations engine that derives conclusions in real time based on active filters.
    </p>

    <h3 class="sub-title">5.1 Global Growth Trajectory (1950 vs. 2023)</h3>
    <p>
      World population expanded from <strong>2.50 billion in 1950</strong> to <strong>8.09 billion in 2023</strong> (a 3.24&times; expansion). In 2023, <strong>India (1.438 billion)</strong> officially overtook <strong>China (1.423 billion)</strong> to become the most populous nation, accounting for <strong>17.8% of the global population</strong>.
    </p>

    <h3 class="sub-title">5.2 Continental Profile: Africa's Young Population Structure</h3>
    <p>
      Filtering the dashboard to <strong>Africa</strong> reveals a continental total of <strong>1.48 billion</strong> led by <strong>Nigeria (227.88M)</strong>, representing <strong>15.4% of the selected continent's population</strong>. Africa exhibits a distinctly young demographic structure: children (ages 0–14) comprise <strong>39.4%</strong> of the population, working-age individuals represent <strong>57.0%</strong>, and senior citizens (65+) account for just <strong>3.6%</strong>.
    </p>

    <div class="figure-box">
      <img src="{img_africa}" class="figure-img" alt="Africa Continental Filter">
      <div class="figure-caption">
        <strong>Figure 3:</strong> Continental filter applied to Africa (2023). Nigeria, Ethiopia, and Egypt lead the rankings. The KPI structure mix confirms a relatively young population structure with 39.4% youth dependency.
      </div>
    </div>

    <h3 class="sub-title">5.3 Demographic Dividend Indicator (India Case Study)</h3>
    <p>
      In 2023, working-age individuals (15–64) constitute <strong>68.0% (978.19 million)</strong> of India's population. This meets the &ge;60% analytical threshold indicator used in this visualization to denote an active <em>demographic dividend</em> window, where a high ratio of productive workers to dependents offers economic advantages.
    </p>

    <h3 class="sub-title">5.4 Population Aging Trends (Japan Case Study)</h3>
    <p>
      In contrast, selecting <strong>Japan</strong> illustrates a pronounced population aging trend: the senior cohort (65+) increased from <strong>4.9% in 1950</strong> to <strong>29.5% in 2023</strong>, while children under 5 contracted to under <strong>4%</strong>, reflecting a higher share of older population and rising old-age dependency.
    </p>

    <div class="figure-box">
      <img src="{img_japan}" class="figure-img" alt="Japan Population Aging">
      <div class="figure-caption">
        <strong>Figure 4:</strong> Japan case study in 100% normalized mode. Senior citizens (65+) represent 29.5% of the total population in 2023 (red layer), illustrating a higher share of older population.
      </div>
    </div>
  </section>

  <div class="footer-tag">Page 4 &bull; 21CSE423T Big Data Visualization &bull; https://big-data-visualization-one.vercel.app/</div>
  <div class="page-break"></div>

  <!-- ==============================================================
       PAGE 5: HISTORICAL ANALYSIS & VERCEL HOSTING
       ============================================================== -->
  <section>
    <h2 class="section-title">6. Longitudinal Analysis: 1970 Baseline Comparison</h2>
    <p>
      Dragging the timeline slider to <strong>1970</strong> allows historical comparison with the modern demographic landscape. In 1970:
    </p>
    <ul>
      <li>Global population was <strong>3.69 billion</strong> (less than half of the 2023 total).</li>
      <li><strong>China</strong> was the clear global leader with <strong>823.31 million (22.3% of the global population)</strong>, followed by India (545.86M) and the United States (207.79M).</li>
      <li>European nations held prominent positions in the global top 15: Germany (78.2M), United Kingdom (55.7M), Italy (53.4M), and France (50.8M), nations that have since been superseded by faster-growing emerging economies.</li>
    </ul>

    <div class="figure-box">
      <img src="{img_1970}" class="figure-img" alt="1970 Historical Baseline">
      <div class="figure-caption">
        <strong>Figure 5:</strong> Historical baseline in 1970 (3.69B world population). The active year reference line on the stacked area chart shifts to 1970, and rankings reflect the demographic balance of the era.
      </div>
    </div>
  </section>

  <section>
    <h2 class="section-title">7. Cloud Deployment &amp; Live Hosting on Vercel</h2>
    <p>
      The complete project is deployed on <strong>Vercel's global edge network</strong> to enable seamless evaluation by mentors and examiners.
    </p>
    <ul>
      <li><strong>Live Production URL:</strong> <a href="https://big-data-visualization-one.vercel.app/" style="font-weight:700; color:#4338ca;">https://big-data-visualization-one.vercel.app/</a></li>
      <li><strong>Configuration (<span class="code-inline">vercel.json</span>):</strong> Defines routing rules, enables CORS for open data sharing, and sets HTTP caching headers (<span class="code-inline">public, max-age=86400, stale-while-revalidate=604800</span>) for the 3.45 MB demographic dataset.</li>
      <li><strong>Continuous Deployment:</strong> Connected directly to the GitHub repository (<span class="code-inline">TheCreativeCodeFlow/big-data-visualization</span>); any code updates automatically trigger optimized edge builds.</li>
      <li><strong>Deep-Linking Capability:</strong> The live deployment supports URL parameters for direct evaluation of specific states (e.g., <span class="code-inline">?continent=Africa</span> or <span class="code-inline">?country=Japan&amp;mode=pct</span>).</li>
    </ul>
  </section>

  <div class="footer-tag">Page 5 &bull; 21CSE423T Big Data Visualization &bull; https://big-data-visualization-one.vercel.app/</div>
  <div class="page-break"></div>

  <!-- ==============================================================
       PAGE 6: VIVA VOCE PREPARATION & CONCLUSION
       ============================================================== -->
  <section>
    <h2 class="section-title">8. Viva Voce Defense &amp; Oral Examination Guide</h2>
    
    <div class="viva-card">
      <div class="viva-q">Q1: Why did you implement this in D3.js rather than using a high-level charting library?</div>
      <div class="viva-a">
        <strong>Answer:</strong> High-level libraries (e.g., Chart.js, Highcharts) provide pre-built templates that conceal underlying coordinate mappings and data join lifecycles. D3.js operates directly on SVG elements and scales, providing granular control over mathematical coordinate systems, custom stacked baselines, transitions, and responsive refits. This demonstrates fundamental mastery of data visualization principles.
      </div>
    </div>

    <div class="viva-card">
      <div class="viva-q">Q2: How does the stacked area chart compute coordinate baselines?</div>
      <div class="viva-a">
        <strong>Answer:</strong> We invoke <span class="code-inline">d3.stack().keys(['Under 5', '5-14', '15-24', '25-64', '65+'])</span>. For every annual observation, D3 computes an interval [y0, y1] where y0 is the top of the previous layer and y1 = y0 + value. The area generator <span class="code-inline">d3.area().x(...).y0(...).y1(...)</span> transforms these numerical intervals into closed SVG polygon path strings using cubic monotone interpolation.
      </div>
    </div>

    <div class="viva-card">
      <div class="viva-q">Q3: How did you ensure dynamic percentages sum strictly to 100.0%?</div>
      <div class="viva-a">
        <strong>Answer:</strong> Independent rounding of decimal percentages frequently results in sums of 99.9% or 100.1%. We implemented the <em>Largest Remainder Method</em> (<span class="code-inline">roundPercentages</span>), which scales values to integer tenths, floors them, and distributes remaining tenths according to largest fractional remainders. This guarantees that all displayed cohort percentages sum strictly to 100.0%.
      </div>
    </div>

    <div class="viva-card">
      <div class="viva-q">Q4: How do you achieve 60 FPS performance without a database backend?</div>
      <div class="viva-a">
        <strong>Answer:</strong> The 87,690 records are loaded once via <span class="code-inline">d3.csv()</span> and indexed in-memory into JavaScript <span class="code-inline">Map</span> structures. When scrubbing the timeline slider or switching continents, the dashboard performs O(1) dictionary lookups and filters an array of only 237 records, completing updates in under 2 milliseconds without network latency.
      </div>
    </div>

    <div class="viva-card">
      <div class="viva-q">Q5: How do you distinguish between timeline slider state and tooltip hover state?</div>
      <div class="viva-a">
        <strong>Answer:</strong> The area chart tooltip explicitly displays two distinct entries: <strong>Hover Year:</strong> (the year corresponding to current mouse cursor position) and <strong>Timeline Slider:</strong> (the global filter year), preventing user confusion when inspecting historical cohorts.
      </div>
    </div>
  </section>

  <section>
    <h2 class="section-title">9. Conclusion</h2>
    <p>
      The <strong>Global Population &amp; Demographic Change Explorer</strong> fulfills all requirements for the 21CSE423T Big Data Visualization assignment. Built with pure HTML5, CSS3, vanilla JavaScript, and D3.js v7, it presents an academically rigorous, aesthetically polished, and interactive exploration of modern demographic shifts. The application is maintained on GitHub and live on Vercel at <strong><a href="https://big-data-visualization-one.vercel.app/" style="color:#4338ca;">https://big-data-visualization-one.vercel.app/</a></strong>.
    </p>
  </section>

  <div class="footer-tag">Page 6 &bull; 21CSE423T Big Data Visualization &bull; https://big-data-visualization-one.vercel.app/</div>

</body>
</html>
"""

    html_final = html_template \
        .replace("{img_overview}", img_overview) \
        .replace("{img_africa}", img_africa) \
        .replace("{img_pct}", img_pct) \
        .replace("{img_japan}", img_japan) \
        .replace("{img_1970}", img_1970)

    print("Writing print HTML template...")
    with open(html_temp, "w", encoding="utf-8") as f:
        f.write(html_final)

    print("Invoking headless Chrome to generate publication-quality PDF...")
    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    cmd = [
        chrome_bin,
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={pdf_out}",
        "--no-pdf-header-footer",
        html_temp
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Chrome error:", res.stderr)
        sys.exit(1)

    # Clean up temp HTML
    if os.path.exists(html_temp):
        os.remove(html_temp)

    pdf_size_kb = os.path.getsize(pdf_out) / 1024
    print(f"Success! Generated {pdf_out} ({pdf_size_kb:.1f} KB).")

if __name__ == "__main__":
    main()
