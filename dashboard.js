
// ---------------- FIREBASE SETUP ----------------

const firebaseConfig = {
    apiKey: "AIzaSyC0aDcQ6-JVbpxEfvvFAN3vBpZEUI2kJj4",
    authDomain: "energy-meter-2-1d879.firebaseapp.com",
    databaseURL: "https://energy-meter-2-1d879-default-rtdb.firebaseio.com",
    projectId: "energy-meter-2-1d879",
    storageBucket: "energy-meter-2-1d879.firebasestorage.app",
    messagingSenderId: "375983188410",
    appId: "1:375983188410:web:04ce4d51b14f2fc0001583",
    measurementId: "G-1DYKPY66YK"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// ---------------- DASHBOARD ----------------

document.addEventListener('DOMContentLoaded', () => {

    // ---------------- NAVIGATION ----------------
    const navLinks = document.querySelectorAll('.nav-menu a');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const titles = {
        'tab-live-monitor': { title: 'Dashboard Overview', sub: 'Real-time system monitoring' },
        'tab-analytics': { title: 'Analytics', sub: 'Deep dive into energy consumption' },
        'tab-power-quality': { title: 'Power Quality', sub: 'Detailed power health metrics' },
        'tab-consumers': { title: 'Consumer Management', sub: 'Manage households and MSMEs' },
        'tab-supplier-analytics': { title: 'Supplier Analytics', sub: 'Global Utility Level Insights' },
        'tab-consumer-profile': { title: 'Consumer Profile', sub: 'Prepaid tariffs and usage' },
        'tab-event-log': { title: 'Event Log', sub: 'Recent system alerts and boundaries crossed' },
        'tab-tariff-settings': { title: 'Tariff Configuration', sub: 'Set unit rates and penalty rules' },
        'tab-meter-health': { title: 'Meter Health Monitor', sub: 'Real-time device status and anomaly detection' },
        'tab-load-shedding': { title: 'Load Shedding & Remote Control', sub: 'Manage disconnections and outages' },
        'tab-complaints': { title: 'Complaints & Tickets', sub: 'Consumer support management' }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Highlight active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Switch tabs
            const targetId = link.getAttribute('data-target');
            tabContents.forEach(tc => {
                if (tc.id === targetId) {
                    tc.style.display = 'block';
                    tc.classList.add('active');
                } else {
                    tc.style.display = 'none';
                    tc.classList.remove('active');
                }
            });

            // Update Header
            if (titles[targetId]) {
                if (pageTitle) pageTitle.innerText = titles[targetId].title;
                if (pageSubtitle) pageSubtitle.innerText = titles[targetId].sub;
            }
        });
    });

    // DOM elements
    const elements = {
        voltage: document.getElementById('live-voltage'),
        current: document.getElementById('live-current'),
        frequency: document.getElementById('live-frequency'),
        pf: document.getElementById('live-pf'),
        power: document.getElementById('live-power'),
        energy: document.getElementById('live-energy'),
        readingCategory: document.getElementById('live-reading-category'),
        // Analytics
        calcPeakLoad: document.getElementById('calc-peak-load'),
        calcAvgLoad: document.getElementById('calc-avg-load'),
        calcTotalEnergy: document.getElementById('calc-total-energy'),
        calcEstCost: document.getElementById('calc-est-cost'),
        // Power Quality
        pqVoltageStatus: document.getElementById('pq-voltage-status'),
        pqFrequencyStatus: document.getElementById('pq-frequency-status'),
        pqPfStatus: document.getElementById('pq-pf-status'),
        // Tariff & Billing
        tbTotalEnergy: document.getElementById('tb-total-energy'),
        tbEstBill: document.getElementById('tb-est-bill')
    };

    // Notification UI
    const notiBtn = document.getElementById('noti-btn');
    const notiDropdown = document.getElementById('noti-dropdown');
    if (notiBtn) {
        notiBtn.addEventListener('click', () => {
            notiDropdown.style.display = notiDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Back button
    const btnBackConsumers = document.getElementById('btn-back-consumers');
    if (btnBackConsumers) {
        btnBackConsumers.addEventListener('click', () => {
            document.querySelector('.nav-menu a[data-target="tab-consumers"]').click();
        });
    }

    window.addNotification = (consumerId, type, msg, isCritical = false) => {
        const list = document.getElementById('noti-list');
        const badge = document.getElementById('noti-badge');
        if (!list || !badge) return;

        if (list.innerHTML.includes('No notifications')) list.innerHTML = '';
        const div = document.createElement('div');
        div.style.padding = '0.75rem';
        let bg = '#F9FAFB', borderVar = 'var(--primary)', textCol = 'var(--text-main)';
        if (type === 'LOW_BALANCE_WARNING') { bg = '#FEF3C7'; borderVar = 'var(--warning)'; textCol = 'var(--warning)'; }
        else if (type === 'CRITICAL_BALANCE_WARNING' || isCritical) { bg = '#FEE2E2'; borderVar = 'var(--danger)'; textCol = 'var(--danger)'; }
        else if (type === 'GRACE_PERIOD_STARTED') { bg = '#DBEAFE'; borderVar = 'var(--primary)'; textCol = 'var(--primary)'; }

        div.style.background = bg;
        div.style.borderLeft = `4px solid ${borderVar}`;
        div.style.borderRadius = '6px';
        div.style.fontSize = '0.9rem';
        div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        div.innerHTML = `<p style="margin:0; color: ${textCol}; font-weight: 600;">${msg}</p><span style="font-size: 0.75rem; color: var(--text-muted);">${new Date().toLocaleTimeString()}</span>`;

        list.prepend(div);
        badge.innerText = parseInt(badge.innerText) + 1;

        db.ref('notifications').push({
            consumer_id: consumerId,
            notification_type: type,
            message: msg,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: "unread"
        });

        window.logSystemEvent(consumerId, type, `Consumer notified: ${msg}`, isCritical ? '--accent-power' : '--primary');
    };

    window.logSystemEvent = (consumerId, type, description, colorVar = '--primary') => {
        const tbody = document.getElementById('event-log-body');
        if (!tbody) return;
        const timeStr = new Date().toLocaleTimeString();

        db.ref('event_logs').push({ timestamp: firebase.database.ServerValue.TIMESTAMP, consumer_id: consumerId, event_type: type, description: description });

        const tr = document.createElement('tr');
        tr.style.transition = "background 0.2s";
        tr.onmouseover = () => tr.style.background = "#F9FAFB";
        tr.onmouseout = () => tr.style.background = "transparent";

        tr.innerHTML = `
            <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--text-muted); font-size: 0.9rem;">${timeStr}</td>
            <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); font-weight: 600; color: var(--text-main);">${consumerId}</td>
            <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                <span class="badge" style="background: ${colorVar === '--accent-power' ? '#FEE2E2' : '#F3F4F6'}; color: var(${colorVar}); border: 1px solid var(${colorVar});">${type}</span>
            </td>
            <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); font-weight: 500;">${description}</td>
        `;
        tbody.prepend(tr);
        if (tbody.children.length > 20) tbody.removeChild(tbody.lastChild);
    };

    // Analytics State
    let peakLoad = 0;
    let totalPower = 0;
    let readingCount = 0;
    const tariffRate = 6.0;

    // Event State
    const eventStates = {
        voltage: 'normal',
        frequency: 'normal',
        pf: 'normal'
    };

    // Chart styling
    Chart.defaults.color = '#6B7280';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { grid: { color: '#E5E7EB' } },
            y: { grid: { color: '#E5E7EB' } }
        },
        plugins: {
            legend: { display: false }
        },
        animation: { duration: 0 }
    };

    // Create charts
    const createChart = (ctxId, label, color) => {
        const ctx = document.getElementById(ctxId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    borderColor: color,
                    backgroundColor: color + '33',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }]
            },
            options: commonOptions
        });
    };

    const charts = {
        voltage: createChart('voltageChart', 'Voltage (V)', '#eab308'),
        power: createChart('powerChart', 'Power (W)', '#ef4444'),
        current: createChart('currentChart', 'Current (A)', '#ec4899'),
        frequency: createChart('frequencyChart', 'Frequency (Hz)', '#8b5cf6')
    };

    const maxDataPoints = 20;

    function updateChartData(chart, label, value) {
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(value);
        if (chart.data.labels.length > maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update();
    }

    // ---- ANALYTICS SUB-TAB SWITCHING ----
    document.querySelectorAll('.analytics-subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.analytics-subtab-btn').forEach(b => {
                b.style.background = 'transparent';
                b.style.color = 'var(--text-main)';
                b.style.border = '1.5px solid var(--glass-border)';
                b.classList.remove('active');
            });
            btn.style.background = 'var(--primary)';
            btn.style.color = '#fff';
            btn.style.border = '1.5px solid var(--primary)';
            btn.classList.add('active');
            const target = btn.getAttribute('data-subtab');
            document.querySelectorAll('.analytics-subtab-content').forEach(c => c.style.display = 'none');
            const panel = document.getElementById(target);
            if (panel) panel.style.display = 'block';
        });
    });

    // ---- PER-HOUSE BAR CHART ----
    const houseNames  = ['house1','house2','house3','house4','house5','house6'];
    const houseColors = [
        'rgba(234,179,8,0.85)', 'rgba(239,68,68,0.85)', 'rgba(16,185,129,0.85)',
        'rgba(99,102,241,0.85)', 'rgba(249,115,22,0.85)', 'rgba(236,72,153,0.85)'
    ];

    let housePowerBarChart = null;
    const barCtxEl = document.getElementById('housePowerBarChart');
    if (barCtxEl) {
        housePowerBarChart = new Chart(barCtxEl.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['House 1','House 2','House 3','House 4','House 5','House 6'],
                datasets: [{
                    label: 'Power (W)',
                    data: [0,0,0,0,0,0],
                    backgroundColor: houseColors,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#E5E7EB' } },
                    y: { grid: { color: '#E5E7EB' }, beginAtZero: true, title: { display: true, text: 'Power (W)' } }
                },
                animation: { duration: 300 }
            }
        });
    }

    // ---- MULTI-HOUSE ANALYTICS CALCULATOR (called every time any reading arrives) ----
    const houseConnectedLoad = { house1: 5, house2: 3, house3: 4, house4: 6, house5: 3.5, house6: 4.5 }; // kW
    const totalConnectedLoadW = Object.values(houseConnectedLoad).reduce((a,b)=>a+b,0) * 1000;

    // Session peak per house (never resets during session)
    const sessionPeakPerHouse = {};
    // Session reading count & sum per house for avg
    const sessionSumPerHouse = {};
    const sessionCountPerHouse = {};
    houseNames.forEach(h => { sessionPeakPerHouse[h]=0; sessionSumPerHouse[h]=0; sessionCountPerHouse[h]=0; });

    function updateMultiHouseAnalytics() {
        const now = Date.now();
        const LIVE_WINDOW_MS = 30000; // 30 s considered 'live'

        let systemPeak = 0, systemMin = Infinity, systemTotalPower = 0;
        let peakHouse = '', minHouse = '';
        let activeCount = 0, offlineCount = 0;
        let totalPfSum = 0, pfHouseCount = 0;
        let sumIndividualPeaks = 0;
        const housePowers = {};
        const houseAvgs   = {};
        const housePfs    = {};
        const houseOnline = {};

        houseNames.forEach(hId => {
            const arr = window.readingsHistory && window.readingsHistory[hId] ? window.readingsHistory[hId] : [];
            const last = arr.length > 0 ? arr[arr.length - 1] : null;
            const isLive = last && (now - (last.local_timestamp || 0)) < LIVE_WINDOW_MS;
            houseOnline[hId] = !!isLive;

            let currentPower = 0;
            let currentPf    = 0;
            if (isLive) {
                currentPower = parseFloat(last.power || last.activePower || 0);
                currentPf    = parseFloat(last.pf || last.power_factor || last.powerFactor || 0);
                activeCount++;
            } else {
                offlineCount++;
            }

            // Update session accumulators only for live data
            if (isLive && currentPower > 0) {
                sessionSumPerHouse[hId]   += currentPower;
                sessionCountPerHouse[hId] += 1;
                if (currentPower > sessionPeakPerHouse[hId]) sessionPeakPerHouse[hId] = currentPower;
            }

            housePowers[hId] = currentPower;
            houseAvgs[hId]   = sessionCountPerHouse[hId] > 0 ? sessionSumPerHouse[hId] / sessionCountPerHouse[hId] : 0;
            housePfs[hId]    = currentPf;

            if (isLive) {
                systemTotalPower += currentPower;
                sumIndividualPeaks += sessionPeakPerHouse[hId];
                if (currentPower > systemPeak) { systemPeak = currentPower; peakHouse = hId; }
                if (currentPower < systemMin)  { systemMin  = currentPower; minHouse  = hId; }
                if (currentPf > 0) { totalPfSum += currentPf; pfHouseCount++; }
            }
        });

        if (systemMin === Infinity) systemMin = 0;
        const systemAvg = activeCount > 0 ? systemTotalPower / activeCount : 0;
        const loadFactor = systemPeak > 0 ? (systemAvg / systemPeak) * 100 : 0;
        const diversityFactor = systemPeak > 0 ? (sumIndividualPeaks / systemPeak) : 0;
        const gridUtil = totalConnectedLoadW > 0 ? (systemTotalPower / totalConnectedLoadW) * 100 : 0;
        const avgPf = pfHouseCount > 0 ? totalPfSum / pfHouseCount : 0;

        // Update timestamp badge
        const tsEl = document.getElementById('analytics-last-updated');
        if (tsEl) tsEl.innerText = 'Updated: ' + new Date().toLocaleTimeString();

        // --- Peak sub-tab ---
        const el = id => document.getElementById(id);
        if (el('calc-peak-load'))    el('calc-peak-load').innerHTML    = `${systemPeak.toFixed(1)} <span style="font-size:1rem;">W</span>`;
        if (el('analytics-peak-house'))   el('analytics-peak-house').innerText   = peakHouse ? peakHouse.replace('house','House ') + ` (${housePowers[peakHouse].toFixed(0)}W)` : '—';
        if (el('analytics-active-houses')) el('analytics-active-houses').innerHTML = `${activeCount} <span style="font-size:1rem; color:var(--text-muted);">/ 6</span>`;

        // Bar chart
        if (housePowerBarChart) {
            housePowerBarChart.data.datasets[0].data = houseNames.map(h => housePowers[h] || 0);
            housePowerBarChart.update();
        }

        // --- Avg sub-tab ---
        if (el('calc-avg-load'))      el('calc-avg-load').innerHTML      = `${systemAvg.toFixed(1)} <span style="font-size:1rem;">W</span>`;
        if (el('analytics-avg-per-house')) el('analytics-avg-per-house').innerHTML = `${systemAvg.toFixed(1)} <span style="font-size:1rem;">W</span>`;
        if (el('analytics-avg-pf'))   el('analytics-avg-pf').innerText   = avgPf > 0 ? avgPf.toFixed(3) : '—';

        // Avg table
        const avgTbody = el('analytics-avg-table-body');
        if (avgTbody) {
            avgTbody.innerHTML = '';
            houseNames.forEach(hId => {
                const live = houseOnline[hId];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:0.6rem 1rem; border-bottom:1px solid var(--glass-border); font-weight:600;">${hId.replace('house','House ')}</td>
                    <td style="padding:0.6rem 1rem; border-bottom:1px solid var(--glass-border); color:var(--accent-power);">${housePowers[hId].toFixed(1)} W</td>
                    <td style="padding:0.6rem 1rem; border-bottom:1px solid var(--glass-border);">${houseAvgs[hId].toFixed(1)} W</td>
                    <td style="padding:0.6rem 1rem; border-bottom:1px solid var(--glass-border);">${housePfs[hId] > 0 ? housePfs[hId].toFixed(3) : '—'}</td>
                    <td style="padding:0.6rem 1rem; border-bottom:1px solid var(--glass-border);">
                        <span style="background:${live?'#DCFCE7':'#F3F4F6'}; color:${live?'#16A34A':'#6B7280'}; padding:0.2rem 0.6rem; border-radius:99px; font-size:0.8rem; font-weight:700;">${live?'● LIVE':'○ OFFLINE'}</span>
                    </td>`;
                avgTbody.appendChild(tr);
            });
        }

        // --- Min sub-tab ---
        if (el('analytics-min-load'))  el('analytics-min-load').innerHTML  = systemMin > 0 ? `${systemMin.toFixed(1)} <span style="font-size:1rem;">W</span>` : '— <span style="font-size:1rem;">W</span>';
        if (el('analytics-min-house')) el('analytics-min-house').innerText  = minHouse ? minHouse.replace('house','House ') + ` (${housePowers[minHouse].toFixed(0)}W)` : '—';
        if (el('analytics-offline-count')) el('analytics-offline-count').innerText = offlineCount;

        // --- Load Factor sub-tab ---
        if (el('analytics-load-factor'))    el('analytics-load-factor').innerHTML    = `${loadFactor.toFixed(1)} <span style="font-size:1rem;">%</span>`;
        if (el('analytics-diversity-factor')) el('analytics-diversity-factor').innerText = diversityFactor.toFixed(2);
        if (el('analytics-grid-util'))      el('analytics-grid-util').innerHTML      = `${gridUtil.toFixed(1)} <span style="font-size:1rem;">%</span>`;

        // Load factor mini progress bars per house
        const lfBarsEl = el('analytics-lf-bars');
        if (lfBarsEl) {
            lfBarsEl.innerHTML = '';
            houseNames.forEach(hId => {
                const maxW = (houseConnectedLoad[hId] || 5) * 1000;
                const pct = Math.min(100, (housePowers[hId] / maxW) * 100);
                const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
                lfBarsEl.innerHTML += `
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span style="width:70px; font-size:0.85rem; font-weight:600; color:var(--text-main);">${hId.replace('house','House ')}</span>
                        <div style="flex:1; background:#E5E7EB; border-radius:99px; height:12px; overflow:hidden;">
                            <div style="width:${pct.toFixed(1)}%; background:${barColor}; height:100%; border-radius:99px; transition:width 0.4s;"></div>
                        </div>
                        <span style="width:80px; text-align:right; font-size:0.85rem; color:var(--text-muted);">${housePowers[hId].toFixed(0)}W / ${maxW}W</span>
                    </div>`;
            });
        }

        // --- Per-House cards sub-tab ---
        const phGrid = el('analytics-per-house-grid');
        if (phGrid) {
            phGrid.innerHTML = '';
            houseNames.forEach((hId, idx) => {
                const live = houseOnline[hId];
                const p = housePowers[hId];
                const pf = housePfs[hId];
                const avg = houseAvgs[hId];
                const peak = sessionPeakPerHouse[hId];
                const maxW = (houseConnectedLoad[hId] || 5) * 1000;
                const pct = Math.min(100, (p / maxW) * 100);
                const dot = live ? '#16A34A' : '#6B7280';
                const statusText = live ? '● LIVE' : '○ OFFLINE';

                const arr = window.readingsHistory && window.readingsHistory[hId] ? window.readingsHistory[hId] : [];
                const last = arr.length > 0 ? arr[arr.length-1] : null;
                const voltage = last ? parseFloat(last.voltage||0).toFixed(1) : '—';
                const frequency = last ? parseFloat(last.frequency||0).toFixed(2) : '—';
                const energy = last ? parseFloat(last.energy||0).toFixed(2) : '—';

                const card = document.createElement('div');
                card.style.cssText = `background:var(--card-bg); border:1.5px solid ${live?houseColors[idx].replace('0.85','0.4'):'#E5E7EB'}; border-radius:16px; padding:1.5rem; transition:transform 0.2s, box-shadow 0.2s;`;
                card.onmouseover = () => { card.style.transform='translateY(-2px)'; card.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; };
                card.onmouseout  = () => { card.style.transform=''; card.style.boxShadow=''; };
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <div>
                            <p style="font-weight:800; font-size:1.15rem; color:var(--text-main);">${hId.replace('house','House ')}</p>
                            <p style="font-size:0.78rem; color:var(--text-muted);">Connected Load: ${houseConnectedLoad[hId]} kW</p>
                        </div>
                        <span style="background:${dot}22; color:${dot}; padding:0.25rem 0.7rem; border-radius:99px; font-size:0.8rem; font-weight:700;">${statusText}</span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:1rem;">
                        <div style="background:#F9FAFB; border-radius:10px; padding:0.6rem 0.75rem; text-align:center;">
                            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.2rem;">POWER</p>
                            <p style="font-size:1.1rem; font-weight:700; color:${houseColors[idx].replace('0.85','1')};">${p.toFixed(0)} W</p>
                        </div>
                        <div style="background:#F9FAFB; border-radius:10px; padding:0.6rem 0.75rem; text-align:center;">
                            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.2rem;">VOLTAGE</p>
                            <p style="font-size:1.1rem; font-weight:700;">${voltage} V</p>
                        </div>
                        <div style="background:#F9FAFB; border-radius:10px; padding:0.6rem 0.75rem; text-align:center;">
                            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.2rem;">POWER FACTOR</p>
                            <p style="font-size:1.1rem; font-weight:700; color:${pf<0.9&&pf>0?'var(--accent-power)':'inherit'};">${pf>0?pf.toFixed(3):'—'}</p>
                        </div>
                        <div style="background:#F9FAFB; border-radius:10px; padding:0.6rem 0.75rem; text-align:center;">
                            <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:0.2rem;">ENERGY</p>
                            <p style="font-size:1.1rem; font-weight:700; color:var(--accent-energy);">${energy} kWh</p>
                        </div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.5rem; display:flex; justify-content:space-between;">
                        <span>Session Avg: ${avg.toFixed(0)} W</span><span>Session Peak: ${peak.toFixed(0)} W</span>
                    </div>
                    <div style="background:#E5E7EB; border-radius:99px; height:8px; overflow:hidden;">
                        <div style="width:${pct.toFixed(1)}%; background:${pct>85?'#ef4444':pct>60?'#f59e0b':houseColors[idx].replace('0.85','1')}; height:100%; border-radius:99px; transition:width 0.4s;"></div>
                    </div>
                    <p style="font-size:0.72rem; color:var(--text-muted); margin-top:0.3rem; text-align:right;">${pct.toFixed(1)}% of capacity</p>
                `;
                phGrid.appendChild(card);
            });
        }
    }

    window.readingsHistory = { house1: [], house2: [], house3: [], house4: [], house5: [], house6: [] };

    // LIVE MONITOR: Dedicated hardware meter fallback!
    db.ref("meter").on("value", (snapshot) => {
        const hardwareData = snapshot.val();
        if (!hardwareData) return;

        // Populate house6 history with real meter data seamlessly
        if (!window.readingsHistory['house6']) window.readingsHistory['house6'] = [];
        let r = { ...hardwareData };
        r.meter_id = 'house6'; 
        r.power = r.activePower || r.power || 0;
        r.powerFactor = r.pf;
        r.local_timestamp = Date.now();
        
        window.readingsHistory['house6'].push(r);
        if (window.readingsHistory['house6'].length > 50) window.readingsHistory['house6'].shift();

        // 1. HARDWARE Live Monitor overwrites simulated dashboards
        if (elements.voltage) elements.voltage.innerText = hardwareData.voltage !== undefined ? hardwareData.voltage : "---";
        if (elements.current) elements.current.innerText = hardwareData.current !== undefined ? hardwareData.current : "---";
        if (elements.frequency) elements.frequency.innerText = hardwareData.frequency !== undefined ? hardwareData.frequency : "---";
        if (elements.pf) elements.pf.innerText = hardwareData.pf !== undefined ? hardwareData.pf : "---";
        if (elements.power) elements.power.innerText = hardwareData.activePower !== undefined ? parseFloat(hardwareData.activePower).toFixed(2) : "---";
        if (elements.energy) elements.energy.innerText = hardwareData.energy !== undefined ? hardwareData.energy : "---";

        // Continuously update Consumer Profile Real-Time Parameters explicitly to THAT specific user's load
        if (currentConsumerId && consumersData[currentConsumerId] && consumersData[currentConsumerId].meter_id === 'house6') {
            const activeP = parseFloat(hardwareData.activePower || hardwareData.power || 0);
            if (document.getElementById('cp-load')) document.getElementById('cp-load').innerText = `${(activeP / 1000).toFixed(2)} kW`;
            if (document.getElementById('cp-pf-history')) document.getElementById('cp-pf-history').innerText = parseFloat(hardwareData.pf || 0).toFixed(2);
            
            if (typeof window.renderConsumerProfileReadingsTable === 'function') {
                window.renderConsumerProfileReadingsTable(currentConsumerId);
            }
        }
        
        // Reading Category (Simulated since it's missing from the live node)
        if (elements.readingCategory) {
            const h = new Date().getHours();
            let cat = "NORMAL";
            if (h >= 18 && h <= 22) cat = "PEAK";
            else if (h >= 23 || h <= 6) cat = "NIGHT";
            elements.readingCategory.innerText = cat;
            elements.readingCategory.style.color = cat === "PEAK" ? "var(--accent-power)" : "var(--primary)";
        }

        const timeNow = new Date().toLocaleTimeString();
        updateChartData(charts.voltage, timeNow, parseFloat(hardwareData.voltage));
        updateChartData(charts.power, timeNow, parseFloat(hardwareData.activePower || hardwareData.power));
        updateChartData(charts.current, timeNow, parseFloat(hardwareData.current));
        updateChartData(charts.frequency, timeNow, parseFloat(hardwareData.frequency));

        // Analytics Calculations & PQ
        processDashboardAnalyticsAndPQ(hardwareData);
        updateMultiHouseAnalytics();
    });

    // SIMULATED HOUSES: Pointing directly to the root readings node mapped by the python/node backend
    db.ref("readings").on("value", (snapshot) => {
        const rootData = snapshot.val();
        if (!rootData) return;

        Object.keys(rootData).forEach(hId => {
            if (hId === 'house6') return; // Ignore if simulated hits hardware namespace by accident
            if (!window.readingsHistory[hId]) window.readingsHistory[hId] = [];
            let r = { ...rootData[hId] };
            r.meter_id = hId; 
            
            const p = parseFloat(r.power || r.activePower || 0);
            const v = parseFloat(r.voltage || 0);
            const i = parseFloat(r.current || 0);
            let computedPf = (v * i) > 0 ? (p / (v * i)) : 0;
            if (computedPf > 1) computedPf = 1.0;
            r.pf = parseFloat(r.pf || r.powerFactor || r.power_factor || computedPf).toFixed(2);
            r.local_timestamp = Date.now();
            
            window.readingsHistory[hId].push(r);
            if (window.readingsHistory[hId].length > 50) window.readingsHistory[hId].shift(); // Keep last 50
        });

        // Trigger real time rewrite of Consumer Profile Table if user is currently looking at it for simulated houses
        if (currentConsumerId && consumersData[currentConsumerId]) {
            const mId = consumersData[currentConsumerId].meter_id;
            if (mId !== 'house6') {
                const houseData = rootData[mId];
                if (houseData) {
                    const activeP = parseFloat(houseData.activePower || houseData.power || 0);
                    let cComputedPf = parseFloat(houseData.pf || houseData.powerFactor || houseData.power_factor || 0);
                    if (!cComputedPf && activeP > 0) {
                        cComputedPf = Math.min(1.0, activeP / (parseFloat(houseData.voltage||0) * parseFloat(houseData.current||0)));
                    }
                    if (document.getElementById('cp-load')) document.getElementById('cp-load').innerText = `${(activeP / 1000).toFixed(2)} kW`;
                    if (document.getElementById('cp-pf-history')) document.getElementById('cp-pf-history').innerText = parseFloat(cComputedPf).toFixed(2);
                }
                
                if (typeof window.renderConsumerProfileReadingsTable === 'function') {
                    window.renderConsumerProfileReadingsTable(currentConsumerId);
                }
            }
        }

        // Also update multi-house analytics whenever any reading arrives
        updateMultiHouseAnalytics();
    });

    function processDashboardAnalyticsAndPQ(data) {
        // Analytics Calculations
        const currentPower = parseFloat(data.power || data.activePower);
        const currentEnergy = parseFloat(data.energy);

        if (!isNaN(currentPower)) {
            if (currentPower > peakLoad) peakLoad = currentPower;

            totalPower += currentPower;
            readingCount++;
            const avgLoad = totalPower / readingCount;

            if (elements.calcPeakLoad) elements.calcPeakLoad.innerHTML = `${peakLoad.toFixed(1)} <span>W</span>`;
            if (elements.calcAvgLoad) elements.calcAvgLoad.innerHTML = `${avgLoad.toFixed(1)} <span>W</span>`;
        }

        if (!isNaN(currentEnergy)) {
            if (elements.calcTotalEnergy) elements.calcTotalEnergy.innerHTML = `${currentEnergy.toFixed(2)} <span>kWh</span>`;
            if (elements.tbTotalEnergy) elements.tbTotalEnergy.innerHTML = `${currentEnergy.toFixed(2)} <span style="font-size: 1.25rem;">kWh</span>`;
            const estCost = currentEnergy * tariffRate;
            if (elements.calcEstCost) elements.calcEstCost.innerText = `₹ ${estCost.toFixed(2)}`;
            if (elements.tbEstBill) elements.tbEstBill.innerText = `₹ ${estCost.toFixed(2)}`;
        }

        // ---------------- EVENT DETECTION ----------------
        const logEvent = (type, condition, value, unit, colorVar) => {
            window.logSystemEvent('all', type, `${condition} (${value} ${unit})`, colorVar);

            if (condition.includes('Swell') || condition.includes('Sag') || condition.includes('Deviation')) {
                window.addNotification('all', 'network_issue', `Network Issue: ${condition} - ${value}${unit}`, true);
                if (window.applyCompensationToAll) window.applyCompensationToAll(5); // Apply small compensation for bad supply
            }
            if (condition.includes('Low Power Factor')) {
                window.addNotification('all', 'low_pf_warning', `Global Low Power Factor detected: ${value}`, true);
            }
        };

        const v = parseFloat(data.voltage);
        const f = parseFloat(data.frequency);
        const pf = parseFloat(data.power_factor);

        if (!isNaN(v)) {
            if (v > 240 && eventStates.voltage !== 'over') {
                logEvent('Voltage', 'Voltage Swell (>240V)', v, 'V', '--accent-power');
                eventStates.voltage = 'over';
                if (elements.pqVoltageStatus) {
                    elements.pqVoltageStatus.innerText = 'Voltage Swell';
                    elements.pqVoltageStatus.style.color = 'var(--accent-power)';
                }
            } else if (v < 210 && eventStates.voltage !== 'under') {
                logEvent('Voltage', 'Voltage Sag (<210V)', v, 'V', '--accent-voltage');
                eventStates.voltage = 'under';
                if (elements.pqVoltageStatus) {
                    elements.pqVoltageStatus.innerText = 'Voltage Sag';
                    elements.pqVoltageStatus.style.color = 'var(--accent-voltage)';
                }
            } else if (v >= 210 && v <= 240 && eventStates.voltage !== 'normal') {
                logEvent('Voltage', 'Returned to Normal', v, 'V', '--accent-energy');
                eventStates.voltage = 'normal';
                if (elements.pqVoltageStatus) {
                    elements.pqVoltageStatus.innerText = 'Normal';
                    elements.pqVoltageStatus.style.color = 'var(--accent-energy)';
                }
            }
        }

        if (!isNaN(f)) {
            if (f > 50.5 && eventStates.frequency !== 'over') {
                logEvent('Frequency', 'Frequency Deviation (>50.5Hz)', f, 'Hz', '--accent-power');
                eventStates.frequency = 'over';
                if (elements.pqFrequencyStatus) {
                    elements.pqFrequencyStatus.innerText = 'Deviation (High)';
                    elements.pqFrequencyStatus.style.color = 'var(--accent-power)';
                }
            } else if (f < 49.5 && eventStates.frequency !== 'under') {
                logEvent('Frequency', 'Frequency Deviation (<49.5Hz)', f, 'Hz', '--accent-power');
                eventStates.frequency = 'under';
                if (elements.pqFrequencyStatus) {
                    elements.pqFrequencyStatus.innerText = 'Deviation (Low)';
                    elements.pqFrequencyStatus.style.color = 'var(--accent-power)';
                }
            } else if (f >= 49.5 && f <= 50.5 && eventStates.frequency !== 'normal') {
                logEvent('Frequency', 'Returned to Normal', f, 'Hz', '--accent-energy');
                eventStates.frequency = 'normal';
                if (elements.pqFrequencyStatus) {
                    elements.pqFrequencyStatus.innerText = 'Normal';
                    elements.pqFrequencyStatus.style.color = 'var(--accent-energy)';
                }
            }
        }

        if (!isNaN(pf)) {
            if (pf < 0.9 && eventStates.pf !== 'low') {
                logEvent('Power Factor', 'Low Power Factor (<0.9)', pf, '', '--accent-pf');
                eventStates.pf = 'low';
                if (elements.pqPfStatus) {
                    elements.pqPfStatus.innerText = 'Low (<0.9)';
                    elements.pqPfStatus.style.color = 'var(--accent-pf)';
                }
            } else if (pf >= 0.9 && eventStates.pf !== 'normal') {
                logEvent('Power Factor', 'Returned to Normal', pf, '', '--accent-energy');
                eventStates.pf = 'normal';
                if (elements.pqPfStatus) {
                    elements.pqPfStatus.innerText = 'Normal';
                    elements.pqPfStatus.style.color = 'var(--accent-energy)';
                }
            }
        }

    }
    // ---------------- HISTORICAL ANALYTICS ----------------

    // Fetch from root-level 'readings' node where the server pushes data
    db.ref("readings").limitToLast(100).on("value", (snapshot) => {
        const readings = [];
        snapshot.forEach(child => {
            const val = child.val();
            if (val.timestamp && !isNaN(parseFloat(val.energy))) {
                readings.push(val);
            }
        });

        if (readings.length === 0) return;

        // Sort by timestamp sequentially
        readings.sort((a, b) => a.timestamp - b.timestamp);

        const latestReading = readings[readings.length - 1];

        // Determine timestamp format (seconds vs ms) up to year ~2603
        const isSeconds = latestReading.timestamp < 20000000000;
        const getDt = (ts) => new Date(ts * (isSeconds ? 1000 : 1));

        const latestDt = getDt(latestReading.timestamp);
        const currentYear = latestDt.getFullYear();
        const currentMonth = latestDt.getMonth();
        const currentDay = latestDt.getDate();
        const currentHour = latestDt.getHours();

        let prevMonthYear = currentYear;
        let prevMonth = currentMonth - 1;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevMonthYear--;
        }

        let maxEnergyHour = -Infinity, minEnergyHour = Infinity;
        let maxEnergyDay = -Infinity, minEnergyDay = Infinity;
        let maxEnergyMonth = -Infinity, minEnergyMonth = Infinity;
        let maxEnergyPrevMonth = -Infinity, minEnergyPrevMonth = Infinity;

        readings.forEach(val => {
            const dt = getDt(val.timestamp);
            const e = parseFloat(val.energy);

            if (dt.getFullYear() === currentYear && dt.getMonth() === currentMonth && dt.getDate() === currentDay && dt.getHours() === currentHour) {
                if (e < minEnergyHour) minEnergyHour = e;
                if (e > maxEnergyHour) maxEnergyHour = e;
            }
            if (dt.getFullYear() === currentYear && dt.getMonth() === currentMonth && dt.getDate() === currentDay) {
                if (e < minEnergyDay) minEnergyDay = e;
                if (e > maxEnergyDay) maxEnergyDay = e;
            }
            if (dt.getFullYear() === currentYear && dt.getMonth() === currentMonth) {
                if (e < minEnergyMonth) minEnergyMonth = e;
                if (e > maxEnergyMonth) maxEnergyMonth = e;
            }
            if (dt.getFullYear() === prevMonthYear && dt.getMonth() === prevMonth) {
                if (e < minEnergyPrevMonth) minEnergyPrevMonth = e;
                if (e > maxEnergyPrevMonth) maxEnergyPrevMonth = e;
            }
        });

        // Calculate consumption by taking difference of max and min energy in that period
        const calcCons = (min, max) => (min !== Infinity && max !== -Infinity && max >= min) ? (max - min) : 0;

        const hrCons = calcCons(minEnergyHour, maxEnergyHour);
        const dayCons = calcCons(minEnergyDay, maxEnergyDay);
        const monthCons = calcCons(minEnergyMonth, maxEnergyMonth);
        const prevMonthCons = calcCons(minEnergyPrevMonth, maxEnergyPrevMonth);

        const hourlyEl = document.getElementById('calc-hourly-energy');
        const dailyEl = document.getElementById('calc-daily-energy');
        const monthlyEl = document.getElementById('calc-monthly-energy');
        const prevMonthlyEl = document.getElementById('calc-prev-monthly-energy');

        if (hourlyEl) hourlyEl.innerHTML = `${hrCons.toFixed(2)} <span>kWh</span>`;
        if (dailyEl) dailyEl.innerHTML = `${dayCons.toFixed(2)} <span>kWh</span>`;
        if (monthlyEl) monthlyEl.innerHTML = `${monthCons.toFixed(2)} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">kWh this month</span>`;

        if (prevMonthlyEl) {
            if (prevMonthCons === 0 && monthCons === 0) {
                prevMonthlyEl.innerHTML = `<span style="color: var(--text-muted); font-size: 0.9rem;">No previous data</span>`;
            } else {
                const diffPrc = prevMonthCons > 0 ? ((monthCons - prevMonthCons) / prevMonthCons) * 100 : 100; // If prev month was 0, assume 100% up
                const trendIcon = diffPrc > 0 ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '<i class="fa-solid fa-arrow-trend-down"></i>';
                const trendColor = diffPrc > 0 ? 'var(--accent-power)' : 'var(--accent-energy)';

                // Display if it's the exact same or up/down
                if (diffPrc === 0) {
                    prevMonthlyEl.innerHTML = `<span style="color: var(--text-muted); font-size: 0.9rem;">Same as last month</span>`;
                } else {
                    prevMonthlyEl.innerHTML = `<span style="color: ${trendColor}; font-size: 0.9rem;">${trendIcon} ${Math.abs(diffPrc).toFixed(1)}% vs last month</span>`;
                }
            }
        }
    });



    // ---------------- CONSUMER & TARIFF MANAGEMENT ----------------
    let consumersData = {};
    let currentConsumerId = null;
    let consumerUsageChartInstance = null;

    let tariffRules = {
        household_tariffs: { slab1_limit: 100, slab1_rate: 4, slab2_limit: 300, slab2_rate: 6, slab3_rate: 8 },
        msme_tariffs: { slab1_limit: 1000, slab1_rate: 7, slab2_limit: 5000, slab2_rate: 8, slab3_limit: 10000, slab3_rate: 9, slab4_rate: 10 },
        power_factor_rules: { pf_warning: 0.95, pf_penalty_1: 0.90, pf_penalty_2: 0.85 }
    };

    db.ref('tariff_rules').on('value', (snap) => {
        if (!snap.exists()) {
            db.ref('tariff_rules').set(tariffRules);
        } else {
            tariffRules = snap.val();
            // Upate UI Config panel
            if (document.getElementById('input-rate-slab1')) {
                document.getElementById('input-rate-slab1').value = tariffRules.household_tariffs.slab1_rate;
                document.getElementById('input-rate-slab2').value = tariffRules.household_tariffs.slab2_rate;
                document.getElementById('input-rate-slab3').value = tariffRules.household_tariffs.slab3_rate;
                
                document.getElementById('input-pf-pen1').value = Math.round(tariffRules.power_factor_rules.pf_penalty_1 * 100);
                document.getElementById('input-pf-pen2').value = Math.round(tariffRules.power_factor_rules.pf_penalty_2 * 100);
            }
        }
    });

    const saveTariffBtn = document.getElementById('save-tariff-btn');
    if (saveTariffBtn) {
        saveTariffBtn.addEventListener('click', () => {
            const rules = { ...tariffRules };
            rules.household_tariffs.slab1_rate = parseFloat(document.getElementById('input-rate-slab1').value || 4);
            rules.household_tariffs.slab2_rate = parseFloat(document.getElementById('input-rate-slab2').value || 6);
            rules.household_tariffs.slab3_rate = parseFloat(document.getElementById('input-rate-slab3').value || 8);
            
            // Penalties expect threshold mapping logic, but the UI edits the extra charge. 
            // Wait, the UI mapped the penalty charge, we map it to our UI threshold
            rules.power_factor_rules.pf_penalty_1_charge = parseFloat(document.getElementById('input-pf-pen1').value || 2) / 100;
            rules.power_factor_rules.pf_penalty_2_charge = parseFloat(document.getElementById('input-pf-pen2').value || 5) / 100;
            
            db.ref('tariff_rules').set(rules);
            alert("Global Tariff Settings Updated Successfully.");
        });
    }

    // -------- TIME-OF-DAY (ToD) TARIFF HELPER --------
    const getTodMultiplier = () => {
        const h = new Date().getHours();
        if (h >= 18 && h <= 22) return { rate: 1.5, label: 'PEAK' };    // Peak: 6PM-10PM
        if (h >= 23 || h <= 5)  return { rate: 0.75, label: 'NIGHT' };  // Night: 11PM-5AM
        return { rate: 1.0, label: 'NORMAL' };
    };

    // -------- METER HEALTH MONITOR --------
    const renderMeterHealth = () => {
        const grid = document.getElementById('meter-health-grid');
        if (!grid || Object.keys(consumersData).length === 0) return;
        grid.innerHTML = '';

        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            const history = window.readingsHistory[c.meter_id] || [];
            const last = history[history.length - 1];

            let status = 'OFFLINE', statusColor = '#6B7280', statusBg = '#F3F4F6', icon = 'fa-circle-xmark';
            let details = 'No data received in last 15 seconds.';

            if (last && Date.now() - (last.local_timestamp || 0) < 15000) {
                const v = parseFloat(last.voltage || 0);
                const p = parseFloat(last.power || last.activePower || 0);
                const pf = parseFloat(last.pf || 0);

                // AI Theft Detection: power draw with near-zero voltage
                if (p > 50 && v < 10) {
                    status = 'TAMPERED'; statusColor = '#DC2626'; statusBg = '#FEE2E2'; icon = 'fa-triangle-exclamation';
                    details = `⚠️ High power draw (${p}W) detected with near-zero voltage (${v}V). Possible bypass!`;
                    if (!window._theftAlerted) { window._theftAlerted = {}; }
                    if (!window._theftAlerted[id]) {
                        window._theftAlerted[id] = true;
                        window.addNotification(id, 'THEFT_SUSPECTED', `Meter ${c.meter_id} flagged: power draw with 0V - possible bypass!`, true);
                        window.logSystemEvent(id, 'THEFT_SUSPECTED', `Power=${p}W, Voltage=${v}V — likely meter bypass`, '--accent-power');
                        db.ref(`consumers/${id}`).update({ status: 'SUSPECTED_THEFT' });
                    }
                } else if (v < 180 && v > 10) {
                    status = 'LOW VOLTAGE'; statusColor = '#D97706'; statusBg = '#FEF3C7'; icon = 'fa-bolt-lightning';
                    details = `Voltage: ${v}V (below 180V threshold)`;
                } else if (pf > 0 && pf < 0.85) {
                    status = 'LOW PF'; statusColor = '#7C3AED'; statusBg = '#EDE9FE'; icon = 'fa-exclamation-circle';
                    details = `Power Factor: ${pf} — below acceptable threshold (0.85)`;
                } else {
                    status = 'HEALTHY'; statusColor = '#16A34A'; statusBg = '#DCFCE7'; icon = 'fa-circle-check';
                    details = `V: ${v}V | P: ${p}W | PF: ${pf}`;
                    if (window._theftAlerted && window._theftAlerted[id]) delete window._theftAlerted[id];
                }
            }

            const card = document.createElement('div');
            card.style.cssText = `background:${statusBg}; border:1.5px solid ${statusColor}33; border-radius:12px; padding:1.25rem;`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <p style="font-weight:700; font-size:1rem;">${c.name}</p>
                        <p style="color:var(--text-muted); font-size:0.8rem;">${id} · ${c.meter_id}</p>
                    </div>
                    <span style="background:${statusColor}; color:#fff; padding:0.3rem 0.75rem; border-radius:99px; font-size:0.8rem; font-weight:700;"><i class="fa-solid ${icon}"></i> ${status}</span>
                </div>
                <p style="font-size:0.85rem; color:#374151;">${details}</p>
            `;
            grid.appendChild(card);
        });
    };
    setInterval(renderMeterHealth, 5000);

    // -------- LOAD SHEDDING / REMOTE DISCONNECT --------
    const renderLoadSheddingGrid = () => {
        const grid = document.getElementById('load-shedding-grid');
        if (!grid || Object.keys(consumersData).length === 0) return;
        grid.innerHTML = '';

        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            const isOff = c.command === 'OFF';
            const card = document.createElement('div');
            card.style.cssText = `background:${isOff ? '#FFF1F2' : '#F0FDF4'}; border:1.5px solid ${isOff ? '#FDA4AF' : '#86EFAC'}; border-radius:12px; padding:1.25rem; display:flex; justify-content:space-between; align-items:center;`;
            card.innerHTML = `
                <div>
                    <p style="font-weight:700;">${c.name}</p>
                    <p style="font-size:0.8rem; color:var(--text-muted);">${id} · ${c.meter_id}</p>
                    <span style="font-size:0.8rem; font-weight:700; color:${isOff ? '#DC2626' : '#16A34A'}">${isOff ? '⛔ DISCONNECTED' : '✅ CONNECTED'}</span>
                </div>
                <button onclick="window.toggleMeterCommand('${id}', '${isOff ? 'ON' : 'OFF'}')"
                    style="padding:0.5rem 1rem; border:none; border-radius:8px; background:${isOff ? '#16A34A' : '#DC2626'}; color:#fff; font-weight:600; cursor:pointer;">
                    ${isOff ? '🔌 Reconnect' : '⛔ Disconnect'}
                </button>
            `;
            grid.appendChild(card);
        });
    };

    window.toggleMeterCommand = (id, cmd) => {
        db.ref(`consumers/${id}`).update({ command: cmd });
        window.logSystemEvent(id, cmd === 'OFF' ? 'REMOTE_DISCONNECT' : 'REMOTE_RECONNECT',
            `Utility issued remote ${cmd} command for ${consumersData[id]?.name}`, cmd === 'OFF' ? '--accent-power' : '--accent-energy');
        setTimeout(renderLoadSheddingGrid, 500);
    };

    document.getElementById('btn-schedule-shed')?.addEventListener('click', () => {
        const category = document.getElementById('shed-category').value;
        const mins = parseInt(document.getElementById('shed-duration').value || 30);
        let affected = 0;
        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            if (category === 'all' || c.category === category) {
                db.ref(`consumers/${id}`).update({ command: 'OFF' });
                affected++;
                setTimeout(() => db.ref(`consumers/${id}`).update({ command: 'ON' }), mins * 60 * 1000);
            }
        });
        window.logSystemEvent('UTILITY', 'LOAD_SHED_SCHEDULED', `Group outage for '${category}' — ${affected} meters × ${mins} min`, '--accent-power');
        alert(`✅ Load shedding command issued to ${affected} meters for ${mins} minutes. Auto-reconnect scheduled.`);
        setTimeout(renderLoadSheddingGrid, 500);
    });

    // -------- COMPLAINTS / SUPPORT TICKETS --------
    db.ref('complaints').on('value', snap => {
        const tbody = document.getElementById('complaints-body');
        if (!tbody) return;
        const filterStatus = document.getElementById('complaint-filter-status')?.value || 'all';

        if (!snap.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:2rem; text-align:center; color:var(--text-muted);">No complaints filed yet.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        const entries = Object.entries(snap.val()).reverse();
        entries.forEach(([ticketId, t]) => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return;
            const statusColor = t.status === 'resolved' ? '#16A34A' : '#D97706';
            const tr = document.createElement('tr');
            const consumer = Object.values(consumersData).find(c => c.meter_id === t.meter_id || t.consumer_id in consumersData);
            tr.innerHTML = `
                <td style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border); font-size:0.8rem; color:var(--text-muted);">${ticketId.slice(-6)}</td>
                <td style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border); font-weight:600;">${t.consumer_name || t.consumer_id || '---'}</td>
                <td style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border);">${t.issue || '---'}</td>
                <td style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border); font-size:0.8rem; color:var(--text-muted);">${t.timestamp ? new Date(t.timestamp).toLocaleString() : '---'}</td>
                <td style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border);">
                    <span style="background:${statusColor}22; color:${statusColor}; padding:0.2rem 0.6rem; border-radius:99px; font-weight:700; font-size:0.8rem; text-transform:capitalize;">${t.status || 'open'}</span>
                </td>
                <td style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border);">
                    ${t.status !== 'resolved' ? `<button onclick="window.resolveTicket('${ticketId}')" style="padding:0.3rem 0.8rem; background:#16A34A; color:#fff; border:none; border-radius:6px; font-size:0.8rem; cursor:pointer;">✔ Resolve</button>` : '<span style="color:#16A34A; font-weight:600;">✔ Done</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    });

    window.resolveTicket = (ticketId) => {
        db.ref(`complaints/${ticketId}`).update({ status: 'resolved', resolved_at: firebase.database.ServerValue.TIMESTAMP });
        window.logSystemEvent('UTILITY', 'TICKET_RESOLVED', `Support ticket ${ticketId.slice(-6)} marked resolved`, '--accent-energy');
    };

    document.getElementById('complaint-filter-status')?.addEventListener('change', () => {
        // Trigger re-read by touching the node
        db.ref('complaints').once('value', snap => {
            const tbody = document.getElementById('complaints-body');
            if (!tbody || !snap.exists()) return;
            // Re-trigger on() listener to re-render with filter
            tbody.dispatchEvent(new Event('filter-change'));
        });
    });
    const createConsumersFromReadings = () => {
        db.ref('readings').limitToLast(100).once('value', (readingsSnap) => {
            const readings = [];
            if (readingsSnap.exists()) {
                readingsSnap.forEach(child => readings.push(child.val()));
            }

            // Compute aggregate stats from readings
            let maxEnergy = 0, sumPf = 0, pfCount = 0, peakPower = 0;
            readings.forEach(r => {
                const e = parseFloat(r.energy || 0);
                if (!isNaN(e) && e > maxEnergy) maxEnergy = e;
                const pf = parseFloat(r.pf || r.power_factor || 0);
                if (pf > 0) { sumPf += pf; pfCount++; }
                const p = parseFloat(r.power || r.activePower || 0);
                if (p > peakPower) peakPower = p;
            });
            const avgPf = pfCount > 0 ? sumPf / pfCount : 0.95;

            const households = [
                { id: 'house1', name: 'House 1',    load: 5,   score: 120, balance: 480.50 },
                { id: 'house2', name: 'House 2',    load: 3,   score: 145, balance: 320.75 },
                { id: 'house3', name: 'House 3',    load: 4,   score: 98,  balance: 150.00 },
                { id: 'house4', name: 'House 4',    load: 6,   score: 160, balance: 720.25 },
                { id: 'house5', name: 'House 5',    load: 3.5, score: 110, balance: 280.00 },
                { id: 'house6', name: 'House 6',    load: 4.5, score: 135, balance: 550.00 }
            ];

            const consumers = {};
            households.forEach((h, i) => {
                consumers[h.id] = {
                    name: h.name,
                    category: 'household',
                    meter_id: h.id, // Explicitly match the server's push object key
                    connected_load: h.load,
                    solar_connection: false,
                    installation_date: '2024-01-10',
                    current_balance: h.balance,
                    credit_score: h.score,
                    status: 'active',
                    total_units: maxEnergy > 0 ? parseFloat((maxEnergy * (0.8 + i * 0.05)).toFixed(2)) : parseFloat((20 + i * 8).toFixed(2)),
                    pf_history: parseFloat((avgPf - i * 0.008).toFixed(3)),
                    penalties: 0,
                    grace_period_start: null,
                    last_penalty_week: 0
                };
            });

            // Save to Firebase — triggers the consumers listener with real data
            db.ref('consumers').set(consumers);
            console.log('Created', households.length, 'household consumers matching server house keys.');
        });
    };

    let consumersInitialized = false;

    db.ref('consumers').on('value', (snapshot) => {
        if (!snapshot.exists() || (!consumersInitialized && Object.keys(snapshot.val()).length < 6)) {
            console.warn("Consumers missing or incomplete. Creating 6 household consumers matching server...");
            consumersData = snapshot.exists() ? snapshot.val() : {};
            renderConsumersTable();
            consumersInitialized = true;
            createConsumersFromReadings();
            return;
        }

        consumersInitialized = true;
        consumersData = snapshot.val();
        
        // --- AUTO-MIGRATE OLD FIREBASE DATA ---
        // If the user's database already contained the old 'meter_10X' from a previous session, dynamically patch it
        // to 'houseX' so that it syncs perfectly with their backend repo without requiring a manual wipe.
        let needsRepair = false;
        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            if (c && c.meter_id && c.meter_id.startsWith('meter_10')) {
                const num = parseInt(c.meter_id.replace('meter_10', ''));
                if (num >= 1 && num <= 6) {
                    c.meter_id = `house${num}`;
                    c.name = `House ${num}`;
                    needsRepair = true;
                }
            }
        });
        if (needsRepair) {
            console.log("Auto-repairing old database schema to match new GitHub node properties.");
            db.ref('consumers').set(consumersData);
            return;
        }

        renderConsumersTable();
        updateSupplierAnalytics();

        if (currentConsumerId && consumersData[currentConsumerId]) {
            renderConsumerProfile(currentConsumerId);
        }
    });

    window.handleViewProfile = (id) => {
        currentConsumerId = id;

        document.querySelectorAll('.tab-content').forEach(tc => {
            tc.style.display = 'none';
            tc.classList.remove('active');
        });
        const profileTab = document.getElementById('tab-consumer-profile');
        if (profileTab) {
            profileTab.style.display = 'block';
            profileTab.classList.add('active');
        }

        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        if (pageTitle) pageTitle.innerText = 'Consumer Profile';
        if (pageSubtitle) pageSubtitle.innerText = 'Prepaid tariffs and usage';

        renderConsumerProfile(id);
    };

    const renderConsumersTable = () => {
        const tbody = document.getElementById('consumers-table-body');
        const filter = document.getElementById('consumer-filter') ? document.getElementById('consumer-filter').value : 'all';
        const searchInput = document.getElementById('consumer-search');
        const search = searchInput ? searchInput.value.toLowerCase() : '';

        if (!tbody) return;

        const existingRowIds = new Set();

        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            let shouldShow = true;
            if (filter !== 'all' && c.category !== filter) shouldShow = false;
            if (search && !c.name.toLowerCase().includes(search) && !id.toLowerCase().includes(search)) shouldShow = false;

            let tr = document.getElementById(`cp-row-${id}`);

            if (!shouldShow) {
                if (tr) tr.style.display = 'none';
                return;
            }

            if (!tr) {
                tr = document.createElement('tr');
                tr.id = `cp-row-${id}`;
                tr.style.transition = '0.2s';
                tr.onmouseover = () => tr.style.background = '#F9FAFB';
                tr.onmouseout = () => tr.style.background = 'transparent';
                tbody.appendChild(tr);
            }
            tr.style.display = 'table-row';

            tr.innerHTML = `
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--text-muted); font-size: 0.9rem;">${id}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); font-weight: 600;">${c.name}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); text-transform: capitalize;">${c.category}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); color: ${c.current_balance < 100 ? 'var(--accent-power)' : 'var(--accent-energy)'}; font-weight: 600;">₹ ${c.current_balance.toFixed(2)}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border);">${c.credit_score}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                    <button onclick="window.handleViewProfile('${id}')" style="padding: 0.4rem 0.8rem; border:none; border-radius: 6px; background: var(--primary); color: #FFFFFF; cursor: pointer; font-size: 0.8rem; font-weight: 500;">View Profile</button>
                </td>
            `;
            existingRowIds.add(`cp-row-${id}`);
        });

        // Clean up deleted ones
        Array.from(tbody.children).forEach(row => {
            if (!existingRowIds.has(row.id)) tbody.removeChild(row);
        });
    };

    document.getElementById('consumer-search')?.addEventListener('input', renderConsumersTable);
    document.getElementById('consumer-filter')?.addEventListener('change', renderConsumersTable);

    const calculateTariff = (category, units) => {
        let cost = 0;
        if (category === 'household' && tariffRules.household_tariffs) {
            const rules = tariffRules.household_tariffs;
            if (units <= rules.slab1_limit) cost = units * rules.slab1_rate;
            else if (units <= rules.slab2_limit) cost = (rules.slab1_limit * rules.slab1_rate) + ((units - rules.slab1_limit) * rules.slab2_rate);
            else cost = (rules.slab1_limit * rules.slab1_rate) + ((rules.slab2_limit - rules.slab1_limit) * rules.slab2_rate) + ((units - rules.slab2_limit) * rules.slab3_rate);
        } else if (category === 'msme' && tariffRules.msme_tariffs) {
            const rules = tariffRules.msme_tariffs;
            if (units <= rules.slab1_limit) cost = units * rules.slab1_rate;
            else if (units <= rules.slab2_limit) cost = (rules.slab1_limit * rules.slab1_rate) + ((units - rules.slab1_limit) * rules.slab2_rate);
            else if (units <= rules.slab3_limit) cost = (rules.slab1_limit * rules.slab1_rate) + ((rules.slab2_limit - rules.slab1_limit) * rules.slab2_rate) + ((units - rules.slab2_limit) * rules.slab3_rate);
            else cost = (rules.slab1_limit * rules.slab1_rate) + ((rules.slab2_limit - rules.slab1_limit) * rules.slab2_rate) + ((rules.slab3_limit - rules.slab2_limit) * rules.slab3_rate) + ((units - rules.slab3_limit) * rules.slab4_rate);
        }
        return cost;
    };

    // Track active profile listeners so we can detach when switching consumers
    let activeReadingsListener = null;
    let activeRechargeListener = null;
    let activeRechargeRef = null;

    const renderConsumerProfile = (id) => {
        const c = consumersData[id];
        if (!c) return;

        // Detach previous real-time listeners to avoid duplicates
        if (activeReadingsListener) {
            db.ref('readings').off('value', activeReadingsListener);
            activeReadingsListener = null;
        }
        if (activeRechargeListener && activeRechargeRef) {
            activeRechargeRef.off('value', activeRechargeListener);
            activeRechargeListener = null;
            activeRechargeRef = null;
        }

        // Identity fields (these don't change)
        document.getElementById('cp-name').innerText = c.name;
        document.getElementById('cp-info').innerText = `ID: ${id} | Meter: ${c.meter_id} | Load: ${c.connected_load} kW`;
        document.getElementById('cp-category').innerText = c.category.toUpperCase();

        // REAL-TIME readings listener — updates ALL parameters when new readings arrive
        // Increased limit to 300 to ensure we get enough data for this specific consumer after filtering out the other 4 households
        window.renderConsumerProfileReadingsTable = (consumerId) => {
            const cc = consumersData[consumerId];
            if (!cc) return;

            let maxPower = 0;
            let totalPf = 0;
            let count = 0;
            let latestPower = 0;
            let latestPf = 0;
            let maxEnergy = 0;
            let minEnergy = Infinity;
            const readingsBody = document.getElementById('cp-readings-body');

            const mId = cc.meter_id;
            const arr = window.readingsHistory && window.readingsHistory[mId] ? window.readingsHistory[mId] : [];

            if (arr.length > 0) {
                const readingsArr = [];
                arr.forEach(r => {
                    const p = parseFloat(r.power || r.activePower || 0);
                    if (p > maxPower) maxPower = p;
                    latestPower = p; 
                    
                    const pfVal = parseFloat(r.pf || r.powerFactor || r.power_factor || 0);
                    if (pfVal > 0) { totalPf += pfVal; count++; latestPf = pfVal; }

                    let e = parseFloat(r.energy || 0);
                    if (!isNaN(e) && e > 0) {
                        if (e > maxEnergy) maxEnergy = e;
                        if (e < minEnergy) minEnergy = e;
                    } else {
                        e = 0;
                        r.energy = e.toFixed(2); 
                    }
                    readingsArr.push(r);
                });

                const totalEnergy = maxEnergy > 0 ? maxEnergy : (cc.total_units || 0);
                if (document.getElementById('cp-stat-energy')) document.getElementById('cp-stat-energy').innerText = `${totalEnergy.toFixed(1)} kWh`;

                const dayOfMonth = Math.max(1, new Date().getDate());
                if (document.getElementById('cp-stat-daily')) document.getElementById('cp-stat-daily').innerText = `${(totalEnergy / dayOfMonth).toFixed(1)} kWh`;

                if (readingsBody) {
                    readingsBody.innerHTML = '';
                    readingsArr.slice().reverse().forEach(r => {
                        const ts = r.timestamp ? new Date(r.timestamp < 20000000000 ? r.timestamp * 1000 : r.timestamp).toLocaleString() : '---';
                        const tr = document.createElement('tr');
                        tr.style.transition = 'background 0.2s';
                        tr.onmouseover = () => tr.style.background = '#F9FAFB';
                        tr.onmouseout = () => tr.style.background = 'transparent';
                        tr.innerHTML = `
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border); color: var(--text-muted); font-size: 0.85rem;">${ts}</td>
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border); font-weight: 500;">${parseFloat(r.voltage||0).toFixed(2)} V</td>
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border); font-weight: 500;">${parseFloat(r.current||0).toFixed(2)} A</td>
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border); font-weight: 600; color: var(--primary);">${parseFloat(r.activePower || r.power || 0).toFixed(2)} W</td>
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border);">${parseFloat(r.pf || r.powerFactor || r.power_factor || 0).toFixed(2)}</td>
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border);">${parseFloat(r.frequency||0).toFixed(2)} Hz</td>
                            <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--glass-border); font-weight: 600; color: var(--accent-energy);">${r.energy || '---'} kWh</td>
                        `;
                        readingsBody.appendChild(tr);
                    });
                }
            } else {
                if (document.getElementById('cp-stat-energy')) document.getElementById('cp-stat-energy').innerText = `${(cc.total_units || 0).toFixed(1)} kWh`;
                if (document.getElementById('cp-stat-daily')) document.getElementById('cp-stat-daily').innerText = `${((cc.total_units || 0) / Math.max(1, new Date().getDate())).toFixed(1)} kWh`;
                if (readingsBody) readingsBody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted);">Fetching Readings...</td></tr>';
            }

            if (document.getElementById('cp-stat-peak')) document.getElementById('cp-stat-peak').innerText = count > 0 ? `${(maxPower / 1000).toFixed(1)} kW` : '- kW';
            const avgPf = count > 0 ? (totalPf / count).toFixed(2) : (cc.pf_history || 0.99).toFixed(2);
            if (document.getElementById('cp-stat-pf')) document.getElementById('cp-stat-pf').innerText = avgPf;
        };
        
        window.renderConsumerProfileReadingsTable(id);

        // REAL-TIME recharge history listener
        activeRechargeRef = db.ref('recharge_history').orderByChild('consumer_id').equalTo(id);
        activeRechargeListener = activeRechargeRef.on('value', snap => {
            const histTbody = document.getElementById('cp-recharge-history');
            if (!histTbody) return;
            histTbody.innerHTML = '';
            if (snap.exists()) {
                const arr = Object.values(snap.val()).sort((a, b) => b.timestamp - a.timestamp);
                arr.forEach(r => {
                    histTbody.innerHTML += `<tr><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">${new Date(r.timestamp).toLocaleDateString()}</td><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border); font-weight: 600; color: var(--accent-energy);">₹ ${r.amount.toFixed(2)}</td></tr>`;
                });
            } else {
                histTbody.innerHTML = '<tr><td colspan="2" style="padding: 1rem 0; color: var(--text-muted);">No recharge history</td></tr>';
            }
        });
    };

    // Recharge action removed per requirement 1: "Remove Consumer Recharge Interface"
    // Recharge actions belong to the consumer application.

    const updateSupplierAnalytics = () => {
        const keys = Object.keys(consumersData);
        if (keys.length === 0) return;

        let totalUsers = keys.length, totalEng = 0, totalRev = 0, totalPf = 0, totalPenalties = 0;
        let graceConsumersCount = 0;
        let overdueConsumersCount = 0;

        keys.forEach(k => {
            const c = consumersData[k];
            totalEng += (c.total_units || 0); totalRev += (c.current_balance || 0);
            totalPf += (c.pf_history || 0.95); totalPenalties += (c.penalties || 0);

            if (c.status === 'GRACE_PERIOD') {
                const gpStart = c.grace_period_start || 0;
                const elapsedWeeks = Math.floor((Date.now() - gpStart) / (7 * 24 * 60 * 60 * 1000));
                if (elapsedWeeks >= 2) {
                    overdueConsumersCount++;
                } else {
                    graceConsumersCount++;
                }
            }
        });

        if (document.getElementById('sa-total-consumers')) document.getElementById('sa-total-consumers').innerText = totalUsers;
        if (document.getElementById('sa-grace-period')) document.getElementById('sa-grace-period').innerText = graceConsumersCount;
        if (document.getElementById('sa-overdue-consumers')) document.getElementById('sa-overdue-consumers').innerText = overdueConsumersCount;
        if (document.getElementById('sa-total-energy')) document.getElementById('sa-total-energy').innerHTML = `${totalEng.toFixed(1)} <span style="font-size: 1rem;">kWh</span>`;
        if (document.getElementById('sa-total-revenue')) document.getElementById('sa-total-revenue').innerText = `₹ ${totalRev.toFixed(2)}`;
        if (document.getElementById('sa-avg-pf')) document.getElementById('sa-avg-pf').innerText = (totalPf / totalUsers).toFixed(3);
        if (document.getElementById('sa-penalties')) document.getElementById('sa-penalties').innerText = `₹ ${totalPenalties.toFixed(2)}`;

        db.ref('utility_statistics/overview').set({
            total_consumers: totalUsers,
            total_energy_supplied: totalEng,
            total_revenue: totalRev,
            average_power_factor: totalPf / totalUsers,
            voltage_quality_index: 0.98,
            frequency_quality_index: 0.99
        });
    };

    window.applyCompensationToAll = (amount) => {
        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            db.ref(`consumers/${id}`).update({ current_balance: c.current_balance + amount });
            window.logSystemEvent(id, 'Compensation', `Utility Quality issue. Credited ₹${amount}`, '--accent-energy');
        });
        if (document.getElementById('sa-compensations')) {
            const cur = parseFloat(document.getElementById('sa-compensations').innerText.replace('₹', '')) || 0;
            document.getElementById('sa-compensations').innerText = `₹ ${(cur + (amount * Object.keys(consumersData).length)).toFixed(2)}`;
        }
    };

    // Simulate real-time tariff deduction and power penalty
    setInterval(() => {
        // Multi-tab locking mechanism so deductions don't aggressively compound if identical dashboard is open multiple times
        const now = Date.now();
        const lastRun = parseInt(localStorage.getItem('billing_engine_lock') || '0');
        if (now - lastRun < 900) return; // Discard execution if another tab ran it within the last second
        localStorage.setItem('billing_engine_lock', now);

        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];

            let consumption = 0;
            const history = window.readingsHistory[c.meter_id];
            if (history && history.length > 0) {
                const last = history[history.length - 1];
                if (Date.now() - (last.local_timestamp || 0) < 15000) {
                    const powerW = parseFloat(last.power || last.activePower || 0);
                    consumption = (powerW / 1000) * (1 / 3600);
                }
            }

            if (consumption <= 0) return; // Prevent draining balance or spamming Firebase if the physical meter is turned offline

            // Re-eval Rate based on slab
            const newTotalUnits = c.total_units + consumption;

            // Apply Time-of-Day multiplier on top of slab tariff
            const tod = getTodMultiplier();
            const baseCost = calculateTariff(c.category, newTotalUnits) - calculateTariff(c.category, c.total_units);
            const energyCharge = baseCost * tod.rate;

            // Net Metering: if solar consumer is feeding back power (negative reading), credit balance
            if (c.solar_connection && consumption < 0) {
                const credit = Math.abs(baseCost) * 0.8; // 80% buyback rate
                db.ref(`consumers/${id}`).update({ current_balance: c.current_balance + credit, total_units: c.total_units });
                window.logSystemEvent(id, 'NET_METERING_CREDIT', `Solar export credited ₹${credit.toFixed(3)} (${tod.label} rate)`, '--accent-energy');
                return;
            }

            let pfPenaltyRate = 0;
            if (c.pf_history < tariffRules.power_factor_rules.pf_penalty_2) pfPenaltyRate = tariffRules.power_factor_rules.pf_penalty_2_charge || 0.05;
            else if (c.pf_history < tariffRules.power_factor_rules.pf_penalty_1) pfPenaltyRate = tariffRules.power_factor_rules.pf_penalty_1_charge || 0.02;

            let pfPenalty = energyCharge * pfPenaltyRate;
            let finalBalance = c.current_balance - energyCharge - pfPenalty;
            let newScore = c.credit_score;
            let newTotalPenalties = (c.penalties || 0) + pfPenalty;
            let newStatus = c.status || 'active';
            let newGpStart = c.grace_period_start || null;
            let lastPenaltyWeek = c.last_penalty_week || 0;

            const wasAbove100 = c.current_balance > 100;
            const wasAbove50 = c.current_balance > 50;
            const wasAbove0 = c.current_balance > 0;

            if (wasAbove100 && finalBalance <= 100 && finalBalance > 50) {
                window.addNotification(id, 'LOW_BALANCE_WARNING', "Your prepaid energy balance is running low. Please recharge soon.", true);
            }
            if (wasAbove50 && finalBalance <= 50 && finalBalance > 0) {
                window.addNotification(id, 'CRITICAL_BALANCE_WARNING', "Critical alert: your energy balance is almost exhausted.", true);
            }

            if (wasAbove0 && finalBalance <= 0) {
                window.addNotification(id, 'GRACE_PERIOD_STARTED', "You have entered the grace period. Please recharge within 14 days to avoid service penalties.", true);
                newStatus = 'GRACE_PERIOD';
                newGpStart = Date.now();
                newScore = Math.max(0, newScore - 5);
            } else if (finalBalance <= 0 && newGpStart) {
                const elapsedWeeks = Math.floor((Date.now() - newGpStart) / (7 * 24 * 60 * 60 * 1000));
                if (elapsedWeeks >= 2) {
                    const weeksOverdue = elapsedWeeks - 1; // Start counting from 1 after 14 days (2 weeks)
                    if (lastPenaltyWeek < elapsedWeeks) {
                        const penaltyAmt = 100 * weeksOverdue;
                        finalBalance -= penaltyAmt;
                        newTotalPenalties += penaltyAmt;
                        lastPenaltyWeek = elapsedWeeks;
                        window.addNotification(id, 'WEEKLY_PENALTY_APPLIED', `A service penalty of ₹${penaltyAmt} has been applied due to delayed recharge.`, true);
                    }
                }
            } else if (finalBalance > 0) {
                newStatus = 'active';
                newGpStart = null;
                lastPenaltyWeek = 0;
            }

            if (pfPenalty > 0 && Math.random() > 0.999) { // drastically reduced arbitrary dropping for low PF
                newScore = Math.max(0, newScore - 1);
            }

            db.ref(`consumers/${id}`).update({
                current_balance: finalBalance,
                total_units: newTotalUnits,
                penalties: newTotalPenalties,
                credit_score: newScore,
                status: newStatus,
                grace_period_start: newGpStart,
                last_penalty_week: lastPenaltyWeek
            });

            db.ref('billing_records').push({
                consumer_id: id,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                units_consumed: consumption,
                energy_charge: energyCharge,
                pf_penalty: pfPenalty,
                demand_penalty: 0,
                utility_compensation: 0,
                final_bill: energyCharge + pfPenalty
            });
        });
    }, 1000); // Dedcut every 1s

});
