/**
 * Global Population & Demographic Change Explorer
 * Course: 21CSE423T - Big Data Visualization
 * 
 * Demonstrates:
 * - D3.js v7 Data Join lifecycle (.join enter/update/exit)
 * - Quantitative and Band scales (scaleLinear, scaleBand)
 * - Time and linear coordinate mapping
 * - Dynamic aggregations with d3.group and d3.rollup
 * - Stacked area generators with d3.stack and d3.area
 * - Synchronized animated transitions (d3.transition)
 * - Coordinated multi-view interaction (cross-filtering)
 */

// ============================================================================
// Global State & Configuration
// ============================================================================
const CONFIG = {
  dataPath: 'data/demographic.csv',
  defaultCountry: 'India',
  defaultContinent: 'All',
  minYear: 1950,
  maxYear: 2023,
  defaultYear: 2023,
  animationIntervalMs: 380,
  topCountriesLimit: 15,
  ageGroups: ['Under 5', '5-14', '15-24', '25-64', '65+'],
  ageColors: {
    'Under 5': '#3b82f6', // Blue
    '5-14': '#06b6d4',    // Cyan
    '15-24': '#10b981',   // Emerald
    '25-64': '#f59e0b',   // Amber
    '65+': '#ef4444'      // Coral Red
  },
  palettePrimary: '#4338ca',
  paletteHighlight: '#d97706'
};

const state = {
  selectedContinent: CONFIG.defaultContinent,
  selectedCountry: 'All',
  selectedYear: CONFIG.defaultYear,
  isPercentageMode: false,
  isPlaying: false,
  playTimer: null,
  activeLegendHighlight: null
};

// Data storage structures
let rawData = [];
let countriesList = [];
let continentsList = [];
let countriesByContinent = new Map();
let yearCountryMap = new Map();     // year -> Map(country -> { country, continent, code, total, ageGroups })
let countryTimeSeries = new Map();   // country -> Array of { year, total, "Under 5", ... }

// Shared D3 selection references
let barChartSvg, areaChartSvg;
let barChartG, areaChartG;
let tooltip;

// ============================================================================
// Initialization & Entry Point
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  createTooltip();
  loadData();
});

/**
 * Loads and processes demographic dataset.
 * Uses d3.csv() with row-level parser to ensure clean numeric types.
 */
function loadData() {
  d3.csv(CONFIG.dataPath, d => {
    return {
      country: d.country.trim(),
      code: d.code.trim(),
      continent: d.continent.trim(),
      year: +d.year,
      age_group: d.age_group.trim(),
      population: Math.max(0, +d.population || 0)
    };
  }).then(loadedData => {
    rawData = loadedData;
    indexData();
    initializeControls();
    initializeCharts();
    updateDashboard();
  }).catch(error => {
    console.error('Fatal: Failed to load dataset from ' + CONFIG.dataPath, error);
    const container = document.querySelector('.dashboard-wrapper');
    if (container) {
      const errBox = document.createElement('div');
      errBox.style.cssText = 'background:#fee2e2;color:#991b1b;padding:20px;border-radius:8px;margin:20px 0;font-weight:600;';
      errBox.innerHTML = `⚠️ Error loading dataset: ${error.message}. Please ensure the project is served via an HTTP server (e.g. VS Code Live Server).`;
      container.prepend(errBox);
    }
  });
}

/**
 * Pre-indexes records for O(1) multi-dimensional lookups.
 * Demonstrates d3.group and d3.rollup concepts.
 */
function indexData() {
  const continentsSet = new Set();
  const countriesMap = new Map(); // country -> continent

  // Group raw rows by (country, year)
  // Each pair has 5 age group rows
  rawData.forEach(d => {
    continentsSet.add(d.continent);
    countriesMap.set(d.country, d.continent);

    // Populate yearCountryMap
    if (!yearCountryMap.has(d.year)) {
      yearCountryMap.set(d.year, new Map());
    }
    const cMap = yearCountryMap.get(d.year);
    if (!cMap.has(d.country)) {
      cMap.set(d.country, {
        country: d.country,
        code: d.code,
        continent: d.continent,
        year: d.year,
        total: 0,
        age_groups: {}
      });
    }
    const record = cMap.get(d.country);
    record.age_groups[d.age_group] = d.population;
    record.total += d.population;
  });

  continentsList = Array.from(continentsSet).sort();

  // Populate countriesByContinent mapping
  countriesList = Array.from(countriesMap.keys()).sort();
  countriesByContinent.set('All', countriesList);

  continentsList.forEach(cont => {
    const subset = countriesList.filter(c => countriesMap.get(c) === cont);
    countriesByContinent.set(cont, subset);
  });

  // Construct countryTimeSeries (1950 to 2023 for every country)
  countriesList.forEach(country => {
    const series = [];
    for (let yr = CONFIG.minYear; yr <= CONFIG.maxYear; yr++) {
      const cData = yearCountryMap.get(yr)?.get(country);
      if (cData) {
        series.push({
          year: yr,
          total: cData.total,
          'Under 5': cData.age_groups['Under 5'] || 0,
          '5-14': cData.age_groups['5-14'] || 0,
          '15-24': cData.age_groups['15-24'] || 0,
          '25-64': cData.age_groups['25-64'] || 0,
          '65+': cData.age_groups['65+'] || 0
        });
      }
    }
    series.sort((a, b) => a.year - b.year);
    countryTimeSeries.set(country, series);
  });
}

// ============================================================================
// Control Bindings & Event Listeners
// ============================================================================
function initializeControls() {
  const continentSelect = document.getElementById('continent-select');
  const countrySelect = document.getElementById('country-select');
  const yearSlider = document.getElementById('year-slider');
  const yearDisplay = document.getElementById('year-val');
  const playBtn = document.getElementById('play-btn');
  const resetBtn = document.getElementById('reset-btn');
  const toggleAbs = document.getElementById('toggle-abs');
  const togglePct = document.getElementById('toggle-pct');

  // Populate Continents
  continentSelect.innerHTML = '<option value="All">All Continents</option>';
  continentsList.forEach(cont => {
    const opt = document.createElement('option');
    opt.value = cont;
    opt.textContent = cont;
    continentSelect.appendChild(opt);
  });

  // Helper to refresh country dropdown
  function updateCountryOptions() {
    const cont = continentSelect.value;
    const available = countriesByContinent.get(cont) || countriesList;
    countrySelect.innerHTML = '<option value="All">All Countries (Top Rankings)</option>';
    available.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      countrySelect.appendChild(opt);
    });
  }

  updateCountryOptions();

  // Read URL query parameters if present (supports bookmarking and deep linking)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('continent')) {
      const c = urlParams.get('continent');
      if (continentsList.includes(c) || c === 'All') {
        state.selectedContinent = c;
        continentSelect.value = c;
        updateCountryOptions();
      }
    }
    if (urlParams.has('country')) {
      const c = urlParams.get('country');
      if (countriesList.includes(c) || c === 'All') {
        state.selectedCountry = c;
        countrySelect.value = c;
      }
    }
    if (urlParams.has('year')) {
      const y = +urlParams.get('year');
      if (y >= CONFIG.minYear && y <= CONFIG.maxYear) {
        state.selectedYear = y;
      }
    }
    if (urlParams.get('mode') === 'pct' || urlParams.get('mode') === 'percent') {
      state.isPercentageMode = true;
      togglePct.classList.add('active');
      toggleAbs.classList.remove('active');
    }
  } catch (err) {
    console.warn('URL params parsing skipped:', err);
  }

  // Continent Change
  continentSelect.addEventListener('change', () => {
    state.selectedContinent = continentSelect.value;
    updateCountryOptions();
    state.selectedCountry = 'All';
    countrySelect.value = 'All';
    updateDashboard();
  });

  // Country Change
  countrySelect.addEventListener('change', () => {
    state.selectedCountry = countrySelect.value;
    updateDashboard();
  });

  // Year Slider
  yearSlider.min = CONFIG.minYear;
  yearSlider.max = CONFIG.maxYear;
  yearSlider.value = state.selectedYear;
  yearDisplay.textContent = state.selectedYear;

  yearSlider.addEventListener('input', e => {
    state.selectedYear = +e.target.value;
    yearDisplay.textContent = state.selectedYear;
    updateDashboard();
  });

  // Play / Pause Animation
  playBtn.addEventListener('click', () => {
    togglePlayback();
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    if (state.isPlaying) togglePlayback(false);
    state.selectedContinent = CONFIG.defaultContinent;
    state.selectedCountry = 'All';
    state.selectedYear = CONFIG.defaultYear;
    state.isPercentageMode = false;
    state.activeLegendHighlight = null;

    continentSelect.value = CONFIG.defaultContinent;
    updateCountryOptions();
    countrySelect.value = 'All';
    yearSlider.value = CONFIG.defaultYear;
    yearDisplay.textContent = CONFIG.defaultYear;

    toggleAbs.classList.add('active');
    togglePct.classList.remove('active');

    updateDashboard();
  });

  // Metric Toggles (Absolute vs Percentage for Area Chart)
  toggleAbs.addEventListener('click', () => {
    if (state.isPercentageMode) {
      state.isPercentageMode = false;
      toggleAbs.classList.add('active');
      togglePct.classList.remove('active');
      updateAreaChart();
    }
  });

  togglePct.addEventListener('click', () => {
    if (!state.isPercentageMode) {
      state.isPercentageMode = true;
      togglePct.classList.add('active');
      toggleAbs.classList.remove('active');
      updateAreaChart();
    }
  });

  // Window Resize Responsiveness
  window.addEventListener('resize', debounce(() => {
    renderCharts();
  }, 180));

  // Initialize Age Legend
  createLegend();
}

/**
 * Handles play/pause timeline animation.
 */
function togglePlayback(forceState) {
  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const yearSlider = document.getElementById('year-slider');
  const yearDisplay = document.getElementById('year-val');

  if (typeof forceState === 'boolean') {
    state.isPlaying = forceState;
  } else {
    state.isPlaying = !state.isPlaying;
  }

  if (state.isPlaying) {
    playIcon.textContent = '⏸';
    playText.textContent = 'Pause';
    playBtn.classList.replace('btn-secondary', 'btn-primary');

    // If already at end, restart from beginning
    if (state.selectedYear >= CONFIG.maxYear) {
      state.selectedYear = CONFIG.minYear;
    }

    state.playTimer = d3.interval(() => {
      if (state.selectedYear >= CONFIG.maxYear) {
        togglePlayback(false);
        return;
      }
      state.selectedYear += 1;
      yearSlider.value = state.selectedYear;
      yearDisplay.textContent = state.selectedYear;
      updateDashboard();
    }, CONFIG.animationIntervalMs);
  } else {
    playIcon.textContent = '▶';
    playText.textContent = 'Play';
    playBtn.classList.replace('btn-primary', 'btn-secondary');
    if (state.playTimer) {
      state.playTimer.stop();
      state.playTimer = null;
    }
  }
}

// ============================================================================
// Tooltip Helper
// ============================================================================
function createTooltip() {
  tooltip = d3.select('#tooltip');
}

function showTooltip(html, event) {
  tooltip
    .html(html)
    .style('opacity', 1)
    .style('left', (event.pageX + 16) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

function moveTooltip(event) {
  tooltip
    .style('left', (event.pageX + 16) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip() {
  tooltip.style('opacity', 0);
}

// ============================================================================
// SVG Chart Containers Initialization
// ============================================================================
function initializeCharts() {
  const barContainer = d3.select('#bar-chart');
  barContainer.selectAll('*').remove();
  barChartSvg = barContainer.append('svg').attr('class', 'chart-svg');
  barChartG = barChartSvg.append('g').attr('class', 'bar-chart-content');

  // Groups for axes and layers
  barChartG.append('g').attr('class', 'grid-x');
  barChartG.append('g').attr('class', 'axis-x');
  barChartG.append('g').attr('class', 'axis-y');
  barChartG.append('g').attr('class', 'bars-layer');
  barChartG.append('g').attr('class', 'labels-layer');

  const areaContainer = d3.select('#area-chart');
  areaContainer.selectAll('*').remove();
  areaChartSvg = areaContainer.append('svg').attr('class', 'chart-svg');
  areaChartG = areaChartSvg.append('g').attr('class', 'area-chart-content');

  areaChartG.append('g').attr('class', 'grid-y');
  areaChartG.append('g').attr('class', 'axis-x');
  areaChartG.append('g').attr('class', 'axis-y');
  areaChartG.append('g').attr('class', 'layers-group');
  areaChartG.append('g').attr('class', 'active-year-group');
  areaChartG.append('g').attr('class', 'hover-group');
}

// ============================================================================
// Main Coordinator: updateDashboard
// ============================================================================
function updateDashboard() {
  updateKPIs();
  updateBarChart();
  updateAreaChart();
  updateObservations();
}

function renderCharts() {
  updateBarChart(true);
  updateAreaChart(true);
}

// ============================================================================
// KPI Cards Update
// ============================================================================
function updateKPIs() {
  const { selectedContinent, selectedCountry, selectedYear } = state;
  const cMap = yearCountryMap.get(selectedYear);

  if (!cMap) return;

  let totalPop = 0;
  const ageTotals = {
    'Under 5': 0,
    '5-14': 0,
    '15-24': 0,
    '25-64': 0,
    '65+': 0
  };

  if (selectedCountry !== 'All') {
    // Single country view
    const countryData = cMap.get(selectedCountry);
    if (countryData) {
      totalPop = countryData.total;
      CONFIG.ageGroups.forEach(grp => {
        ageTotals[grp] = countryData.age_groups[grp] || 0;
      });
    }
  } else {
    // Multi-country / Continent view
    cMap.forEach(d => {
      if (selectedContinent === 'All' || d.continent === selectedContinent) {
        totalPop += d.total;
        CONFIG.ageGroups.forEach(grp => {
          ageTotals[grp] += d.age_groups[grp] || 0;
        });
      }
    });
  }

  // 1. Total Population KPI
  const popValElem = document.getElementById('kpi-pop-val');
  const popSubElem = document.getElementById('kpi-pop-sub');
  popValElem.textContent = formatCompact(totalPop);
  
  if (selectedCountry !== 'All') {
    popSubElem.textContent = `${selectedCountry} (${formatPopulation(totalPop)})`;
  } else if (selectedContinent !== 'All') {
    popSubElem.textContent = `${selectedContinent} Total (${formatPopulation(totalPop)})`;
  } else {
    popSubElem.textContent = `Global Total (${formatPopulation(totalPop)})`;
  }

  // 2. Selected Year KPI
  document.getElementById('kpi-year-val').textContent = selectedYear;
  document.getElementById('kpi-year-sub').textContent = `1950 – 2023 Historical Baseline`;

  // 3. Largest Age Group KPI
  let largestGroup = '';
  let largestCount = -1;
  CONFIG.ageGroups.forEach(grp => {
    if (ageTotals[grp] > largestCount) {
      largestCount = ageTotals[grp];
      largestGroup = grp;
    }
  });

  const largestPct = totalPop > 0 ? ((largestCount / totalPop) * 100).toFixed(1) : 0;
  const ageValElem = document.getElementById('kpi-age-val');
  const ageSubElem = document.getElementById('kpi-age-sub');
  ageValElem.textContent = `${largestGroup}`;
  ageSubElem.textContent = `${largestPct}% of population (${formatCompact(largestCount)})`;

  // 4. Demographic Structure Mix KPI (Youth 0-14, Working 15-64, Elderly 65+)
  const youngCount = ageTotals['Under 5'] + ageTotals['5-14'];
  const workCount = ageTotals['15-24'] + ageTotals['25-64'];
  const elderCount = ageTotals['65+'];

  const [youngPctStr, workPctStr, elderPctStr] = roundPercentages([youngCount, workCount, elderCount], 100, 1);
  const workRatioDisplay = Math.round(parseFloat(workPctStr));

  document.getElementById('kpi-ratio-val').textContent = `${workRatioDisplay}% Working Age`;
  document.getElementById('pct-young').textContent = `${youngPctStr}%`;
  document.getElementById('pct-work').textContent = `${workPctStr}%`;
  document.getElementById('pct-elder').textContent = `${elderPctStr}%`;

  const segYoung = document.getElementById('seg-young');
  const segWork = document.getElementById('seg-work');
  const segElder = document.getElementById('seg-elder');
  if (segYoung && segWork && segElder) {
    segYoung.style.width = `${youngPctStr}%`;
    segWork.style.width = `${workPctStr}%`;
    segElder.style.width = `${elderPctStr}%`;
  }
}

// ============================================================================
// Chart 1: Population by Country (Interactive Bar Chart)
// ============================================================================
function updateBarChart(skipTransition = false) {
  const container = document.getElementById('bar-chart');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const width = Math.max(320, rect.width);
  const height = Math.max(380, rect.height || 420);

  const margin = { top: 16, right: 70, bottom: 40, left: 160 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  barChartSvg
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  barChartG.attr('transform', `translate(${margin.left},${margin.top})`);

  const { selectedContinent, selectedCountry, selectedYear } = state;
  const cMap = yearCountryMap.get(selectedYear);
  if (!cMap) return;

  // Filter countries for selected year and continent
  let countryList = [];
  cMap.forEach(d => {
    if (selectedContinent === 'All' || d.continent === selectedContinent) {
      countryList.push({
        country: d.country,
        code: d.code,
        continent: d.continent,
        population: d.total
      });
    }
  });

  // Sort descending by population
  countryList.sort((a, b) => b.population - a.population);

  // Determine countries to display
  let displayData = [];
  const top15 = countryList.slice(0, CONFIG.topCountriesLimit);

  if (selectedCountry === 'All') {
    displayData = top15;
    document.getElementById('bar-subtitle').textContent = 
      `Top ${displayData.length} countries in ${selectedContinent === 'All' ? 'World' : selectedContinent} (${selectedYear})`;
    document.getElementById('bar-view-info').textContent = `Top ${displayData.length} Ranked`;
  } else {
    // If a country is selected, ensure it is shown
    const selectedItem = countryList.find(d => d.country === selectedCountry);
    const inTop15 = top15.some(d => d.country === selectedCountry);

    if (inTop15) {
      displayData = top15;
    } else if (selectedItem) {
      // Append selected country at the bottom or top
      displayData = [...top15.slice(0, CONFIG.topCountriesLimit - 1), selectedItem];
      displayData.sort((a, b) => b.population - a.population);
    } else {
      displayData = top15;
    }

    document.getElementById('bar-subtitle').textContent = 
      `Ranking including highlighted: ${selectedCountry} (${selectedYear})`;
    document.getElementById('bar-view-info').textContent = `Focus: ${selectedCountry}`;
  }

  // D3 Scales
  const yScale = d3.scaleBand()
    .domain(displayData.map(d => d.country))
    .range([0, innerHeight])
    .padding(0.24);

  const maxPop = d3.max(displayData, d => d.population) || 1;
  const xScale = d3.scaleLinear()
    .domain([0, maxPop * 1.12])
    .range([0, innerWidth])
    .nice();

  const transitionDuration = skipTransition ? 0 : 500;
  const t = barChartSvg.transition().duration(transitionDuration).ease(d3.easeCubicOut);

  // Background Grid Lines
  const gridX = d3.axisBottom(xScale)
    .ticks(5)
    .tickSize(-innerHeight)
    .tickFormat('');

  barChartG.select('.grid-x')
    .attr('transform', `translate(0,${innerHeight})`)
    .transition(t)
    .call(gridX);

  // X Axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d => formatCompact(d));

  barChartG.select('.axis-x')
    .attr('transform', `translate(0,${innerHeight})`)
    .attr('class', 'axis axis-x')
    .transition(t)
    .call(xAxis);

  // Y Axis (Country Names)
  const yAxis = d3.axisLeft(yScale).tickSize(0);

  const yAxisG = barChartG.select('.axis-y')
    .attr('class', 'axis axis-y');

  yAxisG.transition(t)
    .call(yAxis);

  yAxisG.selectAll('.tick text')
    .style('font-weight', d => (d === selectedCountry ? '700' : '500'))
    .style('fill', d => (d === selectedCountry ? CONFIG.paletteHighlight : '#334155'))
    .style('cursor', 'pointer')
    .on('click', (event, countryName) => {
      selectCountryFromChart(countryName);
    });

  // Bars Join (D3 enter / update / exit lifecycle)
  const barsLayer = barChartG.select('.bars-layer');
  const bars = barsLayer.selectAll('.bar-rect')
    .data(displayData, d => d.country);

  bars.exit()
    .transition(t)
    .attr('width', 0)
    .remove();

  bars.enter()
    .append('rect')
    .attr('class', 'bar-rect')
    .attr('y', d => yScale(d.country))
    .attr('x', 0)
    .attr('height', yScale.bandwidth())
    .attr('width', 0)
    .attr('rx', 4)
    .attr('fill', d => (d.country === selectedCountry ? CONFIG.paletteHighlight : CONFIG.palettePrimary))
    .on('mouseover', (event, d) => {
      const shareOfTotal = maxPop > 0 ? ((d.population / maxPop) * 100).toFixed(1) : 0;
      const html = `
        <div class="tooltip-title">${d.country}</div>
        <div class="tooltip-row"><span>Continent:</span><strong>${d.continent}</strong></div>
        <div class="tooltip-row"><span>Timeline Year:</span><strong>${selectedYear}</strong></div>
        <div class="tooltip-row"><span>Population:</span><strong>${formatPopulation(d.population)}</strong></div>
        <div class="tooltip-row"><span>Relative to Leader:</span><strong>${shareOfTotal}%</strong></div>
        <div style="font-size:0.75rem;color:#94a3b8;margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">
          👉 Click to view detailed age progression
        </div>
      `;
      showTooltip(html, event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseout', hideTooltip)
    .on('click', (event, d) => {
      selectCountryFromChart(d.country);
    })
    .merge(bars)
    .classed('highlighted', d => d.country === selectedCountry)
    .transition(t)
    .attr('y', d => yScale(d.country))
    .attr('height', yScale.bandwidth())
    .attr('fill', d => (d.country === selectedCountry ? CONFIG.paletteHighlight : CONFIG.palettePrimary))
    .attr('width', d => Math.max(0, xScale(d.population)));

  // Bar Value Labels Join
  const labelsLayer = barChartG.select('.labels-layer');
  const labels = labelsLayer.selectAll('.bar-label')
    .data(displayData, d => d.country);

  labels.exit()
    .transition(t)
    .style('opacity', 0)
    .remove();

  labels.enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2 + 4)
    .attr('x', d => xScale(d.population) + 6)
    .style('opacity', 0)
    .merge(labels)
    .transition(t)
    .style('opacity', 1)
    .attr('y', d => yScale(d.country) + yScale.bandwidth() / 2 + 4)
    .attr('x', d => xScale(d.population) + 6)
    .text(d => formatCompact(d.population));
}

/**
 * Click handler on bar or Y-axis to focus country in dropdown and Area chart.
 */
function selectCountryFromChart(countryName) {
  state.selectedCountry = countryName;
  const countrySelect = document.getElementById('country-select');
  if (countrySelect) {
    countrySelect.value = countryName;
  }
  updateDashboard();
}

// ============================================================================
// Chart 2: Age Distribution Over Time (Stacked Area Chart)
// ============================================================================
function updateAreaChart(skipTransition = false) {
  const container = document.getElementById('area-chart');
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const width = Math.max(320, rect.width);
  const height = Math.max(380, rect.height || 420);

  const margin = { top: 16, right: 30, bottom: 40, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  areaChartSvg
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  areaChartG.attr('transform', `translate(${margin.left},${margin.top})`);

  // Determine country to display
  let targetCountry = state.selectedCountry;
  let isDefault = false;

  if (targetCountry === 'All') {
    targetCountry = CONFIG.defaultCountry;
    isDefault = true;
  }

  const countryNameElem = document.getElementById('area-country-name');
  if (countryNameElem) {
    countryNameElem.textContent = isDefault ? `${targetCountry} (Default)` : targetCountry;
  }

  const seriesData = countryTimeSeries.get(targetCountry) || [];
  if (seriesData.length === 0) return;

  // D3 Stack Generator
  const stackGen = d3.stack()
    .keys(CONFIG.ageGroups)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  // Prepare data rows (absolute vs percentage)
  let stackedInput = seriesData;
  if (state.isPercentageMode) {
    stackedInput = seriesData.map(d => {
      const norm = { year: d.year, total: d.total };
      const denom = d.total > 0 ? d.total : 1;
      CONFIG.ageGroups.forEach(grp => {
        norm[grp] = (d[grp] / denom) * 100;
      });
      return norm;
    });
  }

  const layers = stackGen(stackedInput);

  // Scales
  const xScale = d3.scaleLinear()
    .domain([CONFIG.minYear, CONFIG.maxYear])
    .range([0, innerWidth]);

  const maxVal = state.isPercentageMode
    ? 100
    : d3.max(seriesData, d => d.total) || 1;

  const yScale = d3.scaleLinear()
    .domain([0, maxVal * 1.04])
    .range([innerHeight, 0])
    .nice();

  // Area Generator
  const areaGen = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveMonotoneX);

  const transitionDuration = skipTransition ? 0 : 500;
  const t = areaChartSvg.transition().duration(transitionDuration).ease(d3.easeCubicOut);

  // Grid Lines
  const gridY = d3.axisLeft(yScale)
    .ticks(5)
    .tickSize(-innerWidth)
    .tickFormat('');

  areaChartG.select('.grid-y')
    .transition(t)
    .call(gridY);

  // X Axis (Years)
  const xAxis = d3.axisBottom(xScale)
    .ticks(8)
    .tickFormat(d3.format('d'));

  areaChartG.select('.axis-x')
    .attr('transform', `translate(0,${innerHeight})`)
    .attr('class', 'axis axis-x')
    .transition(t)
    .call(xAxis);

  // Y Axis (Population / Percent)
  const yAxis = d3.axisLeft(yScale)
    .ticks(6)
    .tickFormat(d => (state.isPercentageMode ? `${d}%` : formatCompact(d)));

  areaChartG.select('.axis-y')
    .attr('class', 'axis axis-y')
    .transition(t)
    .call(yAxis);

  // Stacked Area Layers Join
  const layersGroup = areaChartG.select('.layers-group');
  const layerPaths = layersGroup.selectAll('.area-layer')
    .data(layers, d => d.key);

  layerPaths.exit().remove();

  layerPaths.enter()
    .append('path')
    .attr('class', 'area-layer')
    .attr('fill', d => CONFIG.ageColors[d.key])
    .attr('opacity', 0.88)
    .attr('d', areaGen)
    .merge(layerPaths)
    .transition(t)
    .attr('fill', d => CONFIG.ageColors[d.key])
    .attr('opacity', d => {
      if (state.activeLegendHighlight) {
        return d.key === state.activeLegendHighlight ? 0.95 : 0.22;
      }
      return 0.88;
    })
    .attr('d', areaGen);

  // Active Year Reference Line (Synced with Slider)
  const activeYearGroup = areaChartG.select('.active-year-group');
  activeYearGroup.selectAll('*').remove();

  const currentX = xScale(state.selectedYear);
  activeYearGroup.append('line')
    .attr('class', 'active-year-line')
    .attr('x1', currentX)
    .attr('x2', currentX)
    .attr('y1', 0)
    .attr('y2', innerHeight);

  activeYearGroup.append('text')
    .attr('class', 'active-year-label')
    .attr('x', currentX)
    .attr('y', -4)
    .text(state.selectedYear);

  // Interactive Hover Crosshair & Voronoi/Bisector Tracker
  const hoverGroup = areaChartG.select('.hover-group');
  hoverGroup.selectAll('*').remove();

  const hoverLine = hoverGroup.append('line')
    .attr('class', 'hover-line')
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .style('opacity', 0);

  // Transparent overlay for smooth mouse events across the entire chart
  const bisectYear = d3.bisector(d => d.year).center;

  hoverGroup.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'transparent')
    .style('cursor', 'crosshair')
    .on('mousemove', function(event) {
      const [mouseX] = d3.pointer(event, this);
      const yearHovered = Math.round(xScale.invert(mouseX));
      const clampedYear = Math.max(CONFIG.minYear, Math.min(CONFIG.maxYear, yearHovered));

      const yearIdx = bisectYear(seriesData, clampedYear);
      const datum = seriesData[yearIdx];
      if (!datum) return;

      const posX = xScale(datum.year);
      hoverLine
        .attr('x1', posX)
        .attr('x2', posX)
        .style('opacity', 1);

      // Tooltip HTML content with exact rounded percentages summing to 100%
      const cohortLabels = CONFIG.ageGroups.slice().reverse();
      const cohortCounts = cohortLabels.map(grp => datum[grp] || 0);
      const cohortPcts = roundPercentages(cohortCounts, 100, 1);

      let rowsHtml = '';
      cohortLabels.forEach((grp, idx) => {
        const count = cohortCounts[idx];
        const pct = cohortPcts[idx];
        rowsHtml += `
          <div class="tooltip-row">
            <span><span class="tooltip-badge" style="background:${CONFIG.ageColors[grp]}"></span>${grp}:</span>
            <strong>${state.isPercentageMode ? pct + '%' : formatCompact(count)} (${pct}%)</strong>
          </div>
        `;
      });

      const tooltipContent = `
        <div class="tooltip-title">${targetCountry}</div>
        <div class="tooltip-row" style="margin-bottom:3px;">
          <span>Hover Year:</span>
          <strong style="color:#38bdf8;">${datum.year}</strong>
        </div>
        <div class="tooltip-row" style="margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:4px;">
          <span>Timeline Slider:</span>
          <strong>${state.selectedYear}</strong>
        </div>
        <div class="tooltip-row" style="margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;">
          <span>Total Population (${datum.year}):</span>
          <strong>${formatPopulation(datum.total)}</strong>
        </div>
        ${rowsHtml}
        <div style="font-size:0.74rem;color:#94a3b8;margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">
          👉 Click to jump timeline slider to ${datum.year}
        </div>
      `;
      showTooltip(tooltipContent, event);
    })
    .on('mouseout', () => {
      hoverLine.style('opacity', 0);
      hideTooltip();
    })
    .on('click', function(event) {
      const [mouseX] = d3.pointer(event, this);
      const clickedYear = Math.round(xScale.invert(mouseX));
      const clampedYear = Math.max(CONFIG.minYear, Math.min(CONFIG.maxYear, clickedYear));
      state.selectedYear = clampedYear;
      document.getElementById('year-slider').value = clampedYear;
      document.getElementById('year-val').textContent = clampedYear;
      updateDashboard();
    });
}

// ============================================================================
// Age Groups Legend
// ============================================================================
function createLegend() {
  const legendContainer = d3.select('#area-legend');
  legendContainer.selectAll('*').remove();

  CONFIG.ageGroups.forEach(grp => {
    const item = legendContainer.append('div')
      .attr('class', 'legend-item')
      .attr('data-group', grp);

    item.append('span')
      .attr('class', 'legend-color-box')
      .style('background-color', CONFIG.ageColors[grp]);

    item.append('span')
      .text(grp === '65+' ? 'Ages 65+' : grp === 'Under 5' ? 'Under 5 yrs' : `Ages ${grp}`);

    // Interactive Legend: Hovering highlights this specific area layer
    item.on('mouseenter', () => {
      state.activeLegendHighlight = grp;
      d3.selectAll('.legend-item').classed('dimmed', function() {
        return this.getAttribute('data-group') !== grp;
      });
      areaChartG.selectAll('.area-layer')
        .transition().duration(150)
        .attr('opacity', d => (d.key === grp ? 0.95 : 0.18));
    });

    item.on('mouseleave', () => {
      state.activeLegendHighlight = null;
      d3.selectAll('.legend-item').classed('dimmed', false);
      areaChartG.selectAll('.area-layer')
        .transition().duration(150)
        .attr('opacity', 0.88);
    });
  });
}

// ============================================================================
// Dynamic Observations Generator
// ============================================================================
function updateObservations() {
  const { selectedContinent, selectedCountry, selectedYear } = state;
  const cMap = yearCountryMap.get(selectedYear);
  if (!cMap) return;

  // 1. Leader Observation
  let topCountry = null;
  let maxPop = -1;
  let regionTotal = 0;

  cMap.forEach(d => {
    if (selectedContinent === 'All' || d.continent === selectedContinent) {
      regionTotal += d.total;
      if (d.total > maxPop) {
        maxPop = d.total;
        topCountry = d;
      }
    }
  });

  const leaderElem = document.getElementById('obs-leader');
  if (topCountry && leaderElem) {
    const share = regionTotal > 0 ? ((topCountry.total / regionTotal) * 100).toFixed(1) : 0;
    const isGlobal = selectedContinent === 'All';
    const regionName = isGlobal ? 'the world' : selectedContinent;
    const sharePhrase = isGlobal 
      ? `${share}% of the global population` 
      : `${share}% of the selected continent's population`;

    leaderElem.innerHTML = `
      <strong>${topCountry.country}</strong> is the most populous nation in ${regionName} in ${selectedYear}, 
      with a population of <strong>${formatCompact(topCountry.total)}</strong> (${sharePhrase}).
    `;
  }

  // 2. Growth Observation
  const targetCountry = selectedCountry !== 'All' ? selectedCountry : CONFIG.defaultCountry;
  const timeSeries = countryTimeSeries.get(targetCountry) || [];
  const growthElem = document.getElementById('obs-growth');

  if (timeSeries.length > 0 && growthElem) {
    const initial = timeSeries[0]; // 1950
    const current = timeSeries.find(d => d.year === selectedYear) || timeSeries[timeSeries.length - 1];
    const diff = current.total - initial.total;
    const multiplier = initial.total > 0 ? (current.total / initial.total).toFixed(2) : 1;
    const pctChange = initial.total > 0 ? (((current.total - initial.total) / initial.total) * 100).toFixed(0) : 0;
    const sign = diff >= 0 ? '+' : '';

    growthElem.innerHTML = `
      Between 1950 and ${selectedYear}, <strong>${targetCountry}</strong>'s population grew by 
      <strong>${sign}${formatCompact(diff)}</strong> (${sign}${pctChange}%), expanding 
      <strong>${multiplier}×</strong> from ${formatCompact(initial.total)} to ${formatCompact(current.total)}.
    `;
  }

  // 3. Demographic Dividend Observation
  const dividendElem = document.getElementById('obs-dividend');
  if (timeSeries.length > 0 && dividendElem) {
    const current = timeSeries.find(d => d.year === selectedYear) || timeSeries[timeSeries.length - 1];
    const workAge = (current['15-24'] || 0) + (current['25-64'] || 0);
    const workPct = current.total > 0 ? ((workAge / current.total) * 100).toFixed(1) : 0;
    const isDividend = workPct >= 60;
    const dividendNote = isDividend
      ? 'meeting the &ge;60% analytical indicator used in this visualization to denote an active demographic dividend window.'
      : 'reflecting a shifting age dependency balance based on the analytical indicator used in this visualization.';

    dividendElem.innerHTML = `
      In ${selectedYear}, working-age individuals (15–64) constitute <strong>${workPct}%</strong> 
      (${formatCompact(workAge)}) of <strong>${targetCountry}</strong>'s population, 
      ${dividendNote}
    `;
  }

  // 4. Aging Transition Observation
  const agingElem = document.getElementById('obs-aging');
  if (timeSeries.length > 0 && agingElem) {
    const initial = timeSeries[0];
    const current = timeSeries.find(d => d.year === selectedYear) || timeSeries[timeSeries.length - 1];
    const elderlyCurrentPct = current.total > 0 ? ((current['65+'] / current.total) * 100).toFixed(1) : 0;
    const elderlyInitialPct = initial.total > 0 ? ((initial['65+'] / initial.total) * 100).toFixed(1) : 0;

    let agingDescription = 'a relatively young population structure';
    if (elderlyCurrentPct >= 14) {
      agingDescription = 'a higher share of older population';
    } else if (elderlyCurrentPct >= 7) {
      agingDescription = 'a population aging trend';
    }

    agingElem.innerHTML = `
      The senior cohort (65+) in <strong>${targetCountry}</strong> represents 
      <strong>${elderlyCurrentPct}%</strong> in ${selectedYear} (compared to ${elderlyInitialPct}% in 1950), 
      indicating <strong>${agingDescription}</strong>.
    `;
  }
}

// ============================================================================
// Formatting & Math Utilities
// ============================================================================
function formatPopulation(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return d3.format(',')(Math.round(num));
}

function formatCompact(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e9) {
    return (num / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
  }
  if (abs >= 1e6) {
    return (num / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
  }
  if (abs >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

function roundPercentages(values, targetSum = 100, decimals = 1) {
  const factor = Math.pow(10, decimals);
  const targetScaled = Math.round(targetSum * factor);
  
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return values.map(() => (0).toFixed(decimals));

  const scaled = values.map(v => (v / total) * targetSum * factor);
  const floored = scaled.map(Math.floor);
  let remainder = targetScaled - floored.reduce((a, b) => a + b, 0);

  const diffs = scaled.map((s, i) => ({ index: i, diff: s - floored[i] }));
  diffs.sort((a, b) => b.diff - a.diff);

  for (let i = 0; i < remainder; i++) {
    floored[diffs[i].index]++;
  }

  return floored.map(f => (f / factor).toFixed(decimals));
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

