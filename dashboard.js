
// ---------------- FIREBASE SETUP ----------------

const firebaseConfig = {
    apiKey: "AIzaSyBX213x5BfCS4cwMnybCxFcH6dM0yLuBn4",
    authDomain: "smart-energy-meter-3cc27.firebaseapp.com",
    databaseURL: "https://smart-energy-meter-3cc27-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-energy-meter-3cc27",
    storageBucket: "smart-energy-meter-3cc27.firebasestorage.app",
    messagingSenderId: "404007450535",
    appId: "1:404007450535:web:1238798f3e08a21ea9e882",
    measurementId: "G-8XDFYVGJQL"
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
        'tab-event-log': { title: 'Event Log', sub: 'Recent system alerts and boundaries crossed' }
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

    // ---------------- FIREBASE DATA LISTENER ----------------

    db.ref("meter_readings").limitToLast(1).on("value", (snapshot) => {
        const dataObj = snapshot.val();
        const key = Object.keys(dataObj)[0];
        const data = dataObj[key];

        if (elements.voltage) elements.voltage.innerText = data.voltage;
        if (elements.current) elements.current.innerText = data.current;
        if (elements.frequency) elements.frequency.innerText = data.frequency;
        if (elements.pf) elements.pf.innerText = data.power_factor;
        if (elements.power) elements.power.innerText = data.power;
        if (elements.energy) elements.energy.innerText = data.energy;

        const timeNow = new Date().toLocaleTimeString();

        updateChartData(charts.voltage, timeNow, parseFloat(data.voltage));
        updateChartData(charts.power, timeNow, parseFloat(data.power));
        updateChartData(charts.current, timeNow, parseFloat(data.current));
        updateChartData(charts.frequency, timeNow, parseFloat(data.frequency));

        // Analytics Calculations
        const currentPower = parseFloat(data.power);
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

    });
    // ---------------- HISTORICAL ANALYTICS ----------------

    db.ref("meter_readings").limitToLast(100).on("value", (snapshot) => {
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
        }
    });

    db.ref('consumers').on('value', (snapshot) => {
        if (!snapshot.exists()) {
            const dummyConsumers = {
                'consumer_001': { name: 'Rahul Sharma', category: 'household', meter_id: 'meter_101', connected_load: 5, solar_connection: false, installation_date: '2024-01-10', current_balance: 350, credit_score: 120, status: 'active', total_units: 150, pf_history: 0.96, penalties: 0 },
                'consumer_002': { name: 'Acme Metal Works', category: 'msme', meter_id: 'meter_102', connected_load: 50, solar_connection: true, installation_date: '2024-06-15', current_balance: 15000, credit_score: 160, status: 'active', total_units: 4500, pf_history: 0.92, penalties: 500 },
                'consumer_003': { name: 'Sarah Apartment', category: 'household', meter_id: 'meter_103', connected_load: 5, solar_connection: true, installation_date: '2023-11-20', current_balance: -50, credit_score: 85, status: 'warning', total_units: 320, pf_history: 0.88, penalties: 120 }
            };
            db.ref('consumers').set(dummyConsumers);

            // Seed new meters schema
            db.ref('meters/meter_101/readings/17100001').set({ voltage: 231, current: 3.5, frequency: 49.9, power: 805, power_factor: 0.96, energy_increment: 0.002, outage_flag: 0 });
            db.ref('meters/meter_102/readings/17100001').set({ voltage: 228, current: 40.2, frequency: 50.0, power: 8500, power_factor: 0.92, energy_increment: 0.150, outage_flag: 0 });
            db.ref('meters/meter_103/readings/17100001').set({ voltage: 230, current: 2.1, frequency: 50.1, power: 420, power_factor: 0.88, energy_increment: 0.001, outage_flag: 0 });
            return;
        }

        consumersData = snapshot.val();
        renderConsumersTable();
        updateSupplierAnalytics();

        if (currentConsumerId && consumersData[currentConsumerId]) {
            renderConsumerProfile(currentConsumerId);
        }
    });

    const renderConsumersTable = () => {
        const tbody = document.getElementById('consumers-table-body');
        const filter = document.getElementById('consumer-filter').value;
        const search = document.getElementById('consumer-search').value.toLowerCase();

        if (!tbody) return;
        tbody.innerHTML = '';

        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            if (filter !== 'all' && c.category !== filter) return;
            if (search && !c.name.toLowerCase().includes(search) && !id.toLowerCase().includes(search)) return;

            const tr = document.createElement('tr');
            tr.style.transition = '0.2s';
            tr.onmouseover = () => tr.style.background = '#F9FAFB';
            tr.onmouseout = () => tr.style.background = 'transparent';

            tr.innerHTML = `
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--text-muted); font-size: 0.9rem;">${id}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); font-weight: 600;">${c.name}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); text-transform: capitalize;">${c.category}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border); color: ${c.current_balance < 100 ? 'var(--accent-power)' : 'var(--accent-energy)'}; font-weight: 600;">₹ ${c.current_balance.toFixed(2)}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border);">${c.credit_score}</td>
                <td style="padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                    <button class="view-profile-btn" data-id="${id}" style="padding: 0.4rem 0.8rem; border:none; border-radius: 6px; background: var(--primary); color: #FFFFFF; cursor: pointer; font-size: 0.8rem; font-weight: 500;">View Profile</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
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
            });
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

    const renderConsumerProfile = (id) => {
        const c = consumersData[id];
        if (!c) return;

        document.getElementById('cp-name').innerText = c.name;
        document.getElementById('cp-info').innerText = `ID: ${id} | Meter: ${c.meter_id} | Load: ${c.connected_load} kW`;
        document.getElementById('cp-category').innerText = c.category.toUpperCase();
        document.getElementById('cp-balance').innerText = `₹ ${c.current_balance.toFixed(2)}`;
        document.getElementById('cp-balance').style.color = c.current_balance < 0 ? 'var(--accent-power)' : 'var(--accent-energy)';
        document.getElementById('cp-credit-score').innerText = c.credit_score;
        document.getElementById('cp-load').innerText = `${c.connected_load} kW`;
        document.getElementById('cp-pf-history').innerText = (c.pf_history || 0.99).toFixed(2);
        document.getElementById('cp-penalties').innerText = `₹ ${(c.penalties || 0).toFixed(2)}`;

        if (document.getElementById('cp-stat-energy')) document.getElementById('cp-stat-energy').innerText = `${(c.total_units || 0).toFixed(1)} kWh`;
        if (document.getElementById('cp-stat-daily')) document.getElementById('cp-stat-daily').innerText = `${((c.total_units || 0) / Math.max(1, new Date().getDate())).toFixed(1)} kWh`;

        db.ref(`meters/${c.meter_id}/readings`).limitToLast(50).once('value', snap => {
            let maxPower = 0;
            let totalPf = 0;
            let count = 0;
            if (snap.exists()) {
                snap.forEach(child => {
                    const r = child.val();
                    if (r.power > maxPower) maxPower = r.power;
                    if (r.power_factor) { totalPf += r.power_factor; count++; }
                });
            }
            if (document.getElementById('cp-stat-peak')) document.getElementById('cp-stat-peak').innerText = count > 0 ? `${(maxPower / 1000).toFixed(1)} kW` : '- kW';
            if (document.getElementById('cp-stat-pf')) document.getElementById('cp-stat-pf').innerText = count > 0 ? `${(totalPf / count).toFixed(2)}` : (c.pf_history || 0.99).toFixed(2);
        });

        db.ref('recharge_history').orderByChild('consumer_id').equalTo(id).once('value', snap => {
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
        Object.keys(consumersData).forEach(id => {
            const c = consumersData[id];
            const consumption = c.category === 'msme' ? (Math.random() * 0.1) : (Math.random() * 0.02);

            // Re-eval Rate based on slab
            const newTotalUnits = c.total_units + consumption;
            const energyCharge = calculateTariff(c.category, newTotalUnits) - calculateTariff(c.category, c.total_units);

            let pfPenaltyRate = 0;
            if (c.pf_history < tariffRules.power_factor_rules.pf_penalty_2) pfPenaltyRate = 0.05;
            else if (c.pf_history < tariffRules.power_factor_rules.pf_penalty_1) pfPenaltyRate = 0.02;

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

            if (pfPenalty > 0 && Math.random() > 0.95) { // decrease score randomly for low PF
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
    }, 15000); // Dedcut every 15s

});
