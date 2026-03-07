document.addEventListener('DOMContentLoaded', () => {
    const isGoldPage = document.body.classList.contains('gold-theme');
    const metalKey = isGoldPage ? 'gold' : 'silver';

    // UI Elements
    const elLastUpdated = document.getElementById('last-updated');
    const elLocationHeader = document.getElementById('location-header');
    const elSummaryCards = document.getElementById(isGoldPage ? 'gold-summary-cards' : 'silver-summary-cards');
    const elTablesContainer = document.getElementById(isGoldPage ? 'gold-tables-container' : 'silver-tables-container');

    const btnSyncData = document.getElementById('sync-data-btn');
    const elSyncStatus = document.getElementById('sync-status');

    // Global state for sorting and charts
    window.tableDataState = {};
    window.activeChart = null;

    const formatINR = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
    };

    const parseWeight = (weightStr) => {
        // Simple parser to extract numeric value out of "10 Gram", "1 Kg" for sorting
        if (!weightStr) return 0;
        const lower = weightStr.toLowerCase();
        const num = parseFloat(lower.replace(/[^\d.]/g, ''));
        if (lower.includes('kg')) {
            return num * 1000;
        }
        return num;
    };



    const calcTrendHtml = (changeInr) => {
        if (changeInr === null || changeInr === undefined) return '<span class="text-slate-400 font-medium">-</span>';

        if (changeInr > 0) {
            return `<div class="flex flex-col"><span class="text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-max shadow-sm mb-1">Up</span><span class="text-emerald-600 text-xs md:text-sm font-bold">+₹${formatINR(Math.abs(changeInr))}</span></div>`;
        } else if (changeInr < 0) {
            return `<div class="flex flex-col"><span class="text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-max shadow-sm mb-1">Down</span><span class="text-rose-600 text-xs md:text-sm font-bold">-₹${formatINR(Math.abs(changeInr))}</span></div>`;
        } else {
            return `<div class="flex flex-col"><span class="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-max shadow-sm mb-1">Flat</span><span class="text-slate-500 text-xs md:text-sm font-medium">₹0</span></div>`;
        }
    };

    const createSummaryCardHtml = (title, dataObj, delayIndex) => {
        if (!dataObj) return `<div class="bg-white/40 p-6 rounded-2xl border border-white shadow-sm flex items-center justify-center text-slate-500">Data Unavailable</div>`;

        const { price_today_inr, price_yesterday_inr, price_change_inr } = dataObj;

        let changeIndicator = `<span class="text-slate-500 font-medium">Flat</span>`;
        if (price_change_inr > 0) changeIndicator = `<span class="text-emerald-600 font-bold flex items-center gap-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> +₹${formatINR(Math.abs(price_change_inr))}</span>`;
        if (price_change_inr < 0) changeIndicator = `<span class="text-rose-600 font-bold flex items-center gap-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg> -₹${formatINR(Math.abs(price_change_inr))}</span>`;

        return `
        <div class="bg-white/60 p-6 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow animate-value" style="animation-delay: ${delayIndex * 0.15}s">
            <h4 class="text-slate-500 font-bold tracking-wide uppercase text-sm mb-4">${title}</h4>
            <div class="flex items-baseline gap-1 mb-4 text-slate-800">
                <span class="text-xl font-light text-slate-400">₹</span>
                <span class="text-4xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight truncate">${formatINR(price_today_inr)}</span>
            </div>
            <div class="flex justify-between items-center text-sm border-t border-slate-200 pt-3">
                <span class="text-slate-500 text-xs sm:text-sm">vs Yday (₹${formatINR(price_yesterday_inr)})</span>
                ${changeIndicator}
            </div>
        </div>
        `;
    };

    // Sorting functionality
    window.sortTable = (tableId, columnKey) => {
        const tableObj = window.tableDataState[tableId];
        if (!tableObj) return;

        // Toggle sort direction
        if (tableObj.sortColumn === columnKey) {
            tableObj.sortAsc = !tableObj.sortAsc;
        } else {
            tableObj.sortColumn = columnKey;
            tableObj.sortAsc = true;
        }

        // Sort Data
        tableObj.data.sort((a, b) => {
            let valA, valB;
            if (columnKey === 'weight_unit') {
                valA = parseWeight(a.weight_unit);
                valB = parseWeight(b.weight_unit);
            } else {
                valA = a[columnKey] !== null ? a[columnKey] : 0;
                valB = b[columnKey] !== null ? b[columnKey] : 0;
            }

            if (valA < valB) return tableObj.sortAsc ? -1 : 1;
            if (valA > valB) return tableObj.sortAsc ? 1 : -1;
            return 0;
        });

        // Re-render table body
        const tbody = document.getElementById(`tbody-${tableId}`);
        if (tbody) {
            tbody.innerHTML = renderTableRows(tableObj.data);
            updateSortIcons(tableId, columnKey, tableObj.sortAsc);
        }
    };

    const renderTableRows = (rowsData) => {
        return rowsData.map((row) => `
            <tr class="hover:bg-white/50 transition-colors">
                <td class="px-1.5 sm:px-2 py-2 border-b border-slate-200 text-slate-700 font-semibold whitespace-nowrap">${row.weight_unit}</td>
                <td class="px-1.5 sm:px-2 py-2 border-b border-slate-200 text-slate-900 font-bold">₹${formatINR(row.price_today_inr)}</td>
                <td class="px-1.5 sm:px-2 py-2 border-b border-slate-200 text-slate-500 hidden md:table-cell">₹${formatINR(row.price_yesterday_inr)}</td>
                <td class="px-1.5 sm:px-2 py-2 border-b border-slate-200">${calcTrendHtml(row.price_change_inr)}</td>
            </tr>
        `).join('');
    };

    const updateSortIcons = (tableId, columnKey, isAsc) => {
        // Reset all icons in this table
        document.querySelectorAll(`#th-${tableId} .sort-icon`).forEach(icon => {
            icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />`;
            icon.classList.remove('text-indigo-600');
            icon.classList.add('text-slate-400', 'opacity-50');
        });

        // Highlight active sort icon
        const activeIcon = document.getElementById(`sort-${tableId}-${columnKey}`);
        if (activeIcon) {
            activeIcon.classList.remove('text-slate-400', 'opacity-50');
            activeIcon.classList.add('text-indigo-600', 'opacity-100');
            if (isAsc) {
                activeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />`;
            } else {
                activeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />`;
            }
        }
    };

    const getSortableHeader = (tableId, label, columnKey) => `
        <div class="flex items-center gap-1 cursor-pointer group select-none" onclick="sortTable('${tableId}', '${columnKey}')">
            <span>${label}</span>
            <svg id="sort-${tableId}-${columnKey}" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sort-icon text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        </div>
    `;

    const createTableHtml = (title, tableId, rowsData, delayIndex) => {
        // Init State
        window.tableDataState[tableId] = {
            data: [...rowsData],
            sortColumn: '',
            sortAsc: true
        };

        return `
        <div class="bg-white/40 rounded-2xl border border-white shadow-sm flex flex-col min-w-0 animate-value" style="animation-delay: ${delayIndex * 0.2}s">
            <div class="bg-slate-100/80 px-2 sm:px-3 py-2 border-b border-slate-200">
                <h4 class="font-bold text-slate-800 text-sm sm:text-base">${title}</h4>
            </div>
            <div class="overflow-x-auto w-full">
                <table class="w-full text-left text-[11px] sm:text-xs">
                    <thead>
                        <tr class="bg-white/20" id="th-${tableId}">
                            <th class="px-1.5 sm:px-2 py-2 font-semibold text-slate-600 border-b border-slate-200 hover:bg-white/50 transition-colors">
                                ${getSortableHeader(tableId, 'WGT', 'weight_unit')}
                            </th>
                            <th class="px-1.5 sm:px-2 py-2 font-semibold text-slate-600 border-b border-slate-200 hover:bg-white/50 transition-colors">
                                ${getSortableHeader(tableId, 'PRICE', 'price_today_inr')}
                            </th>
                            <th class="px-1.5 sm:px-2 py-2 font-semibold text-slate-600 border-b border-slate-200 hidden md:table-cell hover:bg-white/50 transition-colors">
                                ${getSortableHeader(tableId, 'YDAY', 'price_yesterday_inr')}
                            </th>
                            <th class="px-1.5 sm:px-2 py-2 font-semibold text-slate-600 border-b border-slate-200 hover:bg-white/50 transition-colors">
                                ${getSortableHeader(tableId, 'TREND', 'price_change_inr')}
                            </th>
                        </tr>
                    </thead>
                    <tbody id="tbody-${tableId}">
                        ${renderTableRows(rowsData)}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    };

    const loadData = async () => {
        try {


            const response = await fetch(`rates_data.json?t=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to fetch rates_data.json');

            const fullData = await response.json();

            // Format Location
            if (elLocationHeader && fullData.meta && fullData.meta.location) {
                elLocationHeader.textContent = fullData.meta.location;
            }

            // Format Last Updated date
            if (elLastUpdated && fullData.meta && fullData.meta.last_updated) {
                const dt = new Date(fullData.meta.last_updated);

                // Specialized formatting: e.g. "08 Mar 2026, 14:30 IST"
                const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
                const timeOptions = { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };

                const dateStr = dt.toLocaleDateString('en-IN', dateOptions);
                const timeStr = dt.toLocaleTimeString('en-IN', timeOptions);

                elLastUpdated.textContent = `${dateStr} @ ${timeStr}`;
            }

            setTimeout(() => {
                if (isGoldPage) {
                    renderGold(fullData.datasource.gold_rates);
                    renderChart('goldPriceChart', fullData.datasource.gold_history, '24K');
                } else {
                    renderSilver(fullData.datasource.silver_rates);
                    renderChart('silverPriceChart', fullData.datasource.silver_history, null);
                }

            }, 300);

        } catch (error) {
            console.error('Error loading rates:', error);
            if (elSummaryCards) elSummaryCards.innerHTML = '<div class="col-span-full text-red-500 font-bold bg-red-50 p-4 rounded-xl">Error loading data. Ensure rates_data.json exists.</div>';

        }
    };

    const renderGold = (ratesArr) => {
        if (!ratesArr || ratesArr.length === 0) return;

        // Group by purity
        const gold24 = ratesArr.filter(r => r.purity === '24K');
        const gold22 = ratesArr.filter(r => r.purity === '22K');
        const gold18 = ratesArr.filter(r => r.purity === '18K');

        // Render Summaries (1 Gram each)
        const g24_1g = gold24.find(r => r.weight_unit.includes('1 Gram') || r.weight_unit === '1') || gold24[0];
        const g22_1g = gold22.find(r => r.weight_unit.includes('1 Gram') || r.weight_unit === '1') || gold22[0];
        const g18_1g = gold18.find(r => r.weight_unit.includes('1 Gram') || r.weight_unit === '1') || gold18[0];

        if (elSummaryCards) {
            elSummaryCards.innerHTML =
                createSummaryCardHtml('24K Pure Gold (1g)', g24_1g, 1) +
                createSummaryCardHtml('22K Standard Gold (1g)', g22_1g, 2) +
                createSummaryCardHtml('18K Gold (1g)', g18_1g, 3);
        }

        // Render Comprehensive Tables
        if (elTablesContainer) {
            elTablesContainer.innerHTML =
                createTableHtml('24 Karat Gold', 'tbl-gold-24', gold24, 1) +
                createTableHtml('22 Karat Gold', 'tbl-gold-22', gold22, 2) +
                createTableHtml('18 Karat Gold', 'tbl-gold-18', gold18, 3);
        }
    };

    const renderSilver = (ratesArr) => {
        if (!ratesArr || ratesArr.length === 0) return;

        // Render Summaries (1 Kg and 1 Gram)
        const s_1kg = ratesArr.find(r => r.weight_unit.includes('1 Kg')) || ratesArr[ratesArr.length - 1];
        const s_1g = ratesArr.find(r => r.weight_unit.includes('1 Gram') || r.weight_unit === '1') || ratesArr[0];

        if (elSummaryCards) {
            elSummaryCards.innerHTML =
                createSummaryCardHtml('Pure Silver (1 Kg)', s_1kg, 1) +
                createSummaryCardHtml('Pure Silver (1 Gram)', s_1g, 2);
        }

        // Render Comprehensive Table (All weights)
        if (elTablesContainer) {
            // we removed the flex grid for silver.html to make it full width
            elTablesContainer.innerHTML = createTableHtml('Silver All Weights', 'tbl-silver', ratesArr, 1);
        }
    };

    // Chart.js Integration
    const renderChart = (canvasId, historyArr, purityFilter) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Clean up existing chart instance if one exists
        if (window.activeChart) {
            window.activeChart.destroy();
        }

        if (!historyArr || historyArr.length === 0) return;

        // The scraped history array is descending (newest -> oldest). 
        // We need to reverse it to timeline order (oldest -> newest) for Chart.js
        const timelineData = [...historyArr].reverse();

        const labels = [];
        const historyPrices = [];

        // Map the parsed JSON objects into discrete arrays for Chart JS
        timelineData.forEach(day => {
            // Reformat literal 'Mar 07, 2026' strings for cleaner X-axis fitting 
            const d = new Date(day.date);
            labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));

            if (purityFilter === '24K') {
                historyPrices.push(day.price_24k);
            } else {
                historyPrices.push(day.price_1kg);
            }
        });

        // Chart Aesthetics Configuration
        const ctx = canvas.getContext('2d');

        // Create Gradient Fill
        let gradient;
        let borderColor;

        if (isGoldPage) {
            gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(234, 179, 8, 0.4)'); // Yellow-500
            gradient.addColorStop(1, 'rgba(234, 179, 8, 0.0)');
            borderColor = '#eab308';
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(148, 163, 184, 0.4)'); // Slate-400
            gradient.addColorStop(1, 'rgba(148, 163, 184, 0.0)');
            borderColor = '#94a3b8';
        }

        window.activeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: isGoldPage ? '24K Gold Price (1 Gram)' : 'Silver Price (1 Kg)',
                    data: historyPrices,
                    borderColor: borderColor,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: borderColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4 // Rounded curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false // Hide default legend
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900 glass
                        titleColor: '#e2e8f0', // Slate-200
                        bodyColor: '#ffffff',
                        bodyFont: {
                            weight: 'bold'
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '₹' + new Intl.NumberFormat('en-IN').format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b', // Slate-500
                            font: {
                                family: "'Inter', sans-serif"
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(203, 213, 225, 0.2)', // Slate-300 light
                            borderDash: [5, 5],
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: "'Inter', sans-serif"
                            },
                            callback: function (value) {
                                return '₹' + new Intl.NumberFormat('en-IN').format(value);
                            }
                        }
                    }
                }
            }
        });
    };

    // Initialization
    loadData();

    if (btnSyncData) {
        btnSyncData.addEventListener('click', async () => {
            try {
                btnSyncData.disabled = true;
                btnSyncData.innerHTML = `
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                `;
                elSyncStatus.classList.remove('hidden', 'text-rose-500', 'text-emerald-500');
                elSyncStatus.classList.add('text-slate-500');
                elSyncStatus.textContent = "Syncing...";

                const res = await fetch('/api/sync-data', { method: 'POST' });
                const result = await res.json();

                if (res.ok && result.status === 'success') {
                    elSyncStatus.textContent = "Sync successful!";
                    elSyncStatus.classList.remove('text-slate-500', 'text-rose-500');
                    elSyncStatus.classList.add('text-emerald-500');

                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    throw new Error(result.message || "Unknown error");
                }
            } catch (error) {
                console.error("Sync API Error:", error);
                elSyncStatus.textContent = `Error: ${error.message}`;
                elSyncStatus.classList.remove('hidden', 'text-emerald-500', 'text-slate-500');
                elSyncStatus.classList.add('text-rose-500');

                btnSyncData.disabled = false;
                btnSyncData.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Update Data
                `;
            }
        });
    }

});
