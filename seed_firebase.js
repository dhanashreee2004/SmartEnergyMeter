/**
 * Smart Energy Meter - Firebase Realtime Database Seeder
 * -------------------------------------------------------
 * Run once from terminal with Node.js:
 *    node seed_firebase.js
 *
 * Pushes: consumers (all 6 houses), tariff_rules (with ToD + PF config),
 * sample complaints, utility_statistics, and event_logs seed data.
 *
 * Requires: npm install firebase-admin
 * Download your Firebase service account key JSON from:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 * Save it as serviceAccountKey.json in this same folder.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://energy-meter-2-1d879-default-rtdb.firebaseio.com'
});

const db = admin.database();

// ── 1. CONSUMERS ────────────────────────────────────────────────────────────
const consumers = {
    house1: {
        name: 'House 1',
        category: 'household',
        meter_id: 'house1',
        connected_load: 5,
        solar_connection: false,
        installation_date: '2024-01-10',
        current_balance: 480.50,
        credit_score: 120,
        status: 'active',
        command: 'ON',
        total_units: 48.20,
        pf_history: 0.96,
        penalties: 0,
        grace_period_start: null,
        last_penalty_week: 0
    },
    house2: {
        name: 'House 2',
        category: 'household',
        meter_id: 'house2',
        connected_load: 3,
        solar_connection: true,  // Solar-enabled — net metering active
        installation_date: '2024-02-14',
        current_balance: 320.75,
        credit_score: 145,
        status: 'active',
        command: 'ON',
        total_units: 62.10,
        pf_history: 0.94,
        penalties: 0,
        grace_period_start: null,
        last_penalty_week: 0
    },
    house3: {
        name: 'House 3',
        category: 'household',
        meter_id: 'house3',
        connected_load: 4,
        solar_connection: false,
        installation_date: '2024-03-05',
        current_balance: 150.00,
        credit_score: 98,
        status: 'active',
        command: 'ON',
        total_units: 95.80,
        pf_history: 0.91,
        penalties: 12.50,
        grace_period_start: null,
        last_penalty_week: 0
    },
    house4: {
        name: 'House 4',
        category: 'household',
        meter_id: 'house4',
        connected_load: 6,
        solar_connection: false,
        installation_date: '2024-01-22',
        current_balance: 720.25,
        credit_score: 160,
        status: 'active',
        command: 'ON',
        total_units: 210.40,
        pf_history: 0.97,
        penalties: 0,
        grace_period_start: null,
        last_penalty_week: 0
    },
    house5: {
        name: 'House 5',
        category: 'household',
        meter_id: 'house5',
        connected_load: 3.5,
        solar_connection: true,  // Solar-enabled
        installation_date: '2024-04-11',
        current_balance: 280.00,
        credit_score: 110,
        status: 'active',
        command: 'ON',
        total_units: 134.60,
        pf_history: 0.93,
        penalties: 5.00,
        grace_period_start: null,
        last_penalty_week: 0
    },
    house6: {
        name: 'House 6',
        category: 'household',
        meter_id: 'house6',     // Mapped to real /meter hardware node
        connected_load: 4.5,
        solar_connection: false,
        installation_date: '2024-05-01',
        current_balance: 550.00,
        credit_score: 135,
        status: 'active',
        command: 'ON',
        total_units: 88.00,
        pf_history: 0.95,
        penalties: 0,
        grace_period_start: null,
        last_penalty_week: 0
    }
};

// ── 2. TARIFF RULES (with ToD config, PF penalties) ─────────────────────────
const tariffRules = {
    household_tariffs: {
        slab1_limit: 100,
        slab1_rate: 4,
        slab2_limit: 300,
        slab2_rate: 6,
        slab3_rate: 8
    },
    msme_tariffs: {
        slab1_limit: 1000,
        slab1_rate: 7,
        slab2_limit: 5000,
        slab2_rate: 8,
        slab3_limit: 10000,
        slab3_rate: 9,
        slab4_rate: 10
    },
    power_factor_rules: {
        pf_warning: 0.95,
        pf_penalty_1: 0.90,
        pf_penalty_2: 0.85,
        pf_penalty_1_charge: 0.02,   // 2% surcharge on energy bill
        pf_penalty_2_charge: 0.05    // 5% surcharge on energy bill
    },
    tod_tariff: {
        enabled: true,
        peak_start_hour: 18,          // 6 PM
        peak_end_hour: 22,            // 10 PM
        peak_multiplier: 1.5,         // 1.5x rate during peak
        night_start_hour: 23,         // 11 PM
        night_end_hour: 5,            // 5 AM
        night_multiplier: 0.75        // 0.75x rate during night (off-peak discount)
    },
    net_metering: {
        enabled: true,
        buyback_rate: 0.80            // 80% credit for solar energy sent to grid
    }
};

// ── 3. SAMPLE COMPLAINTS ─────────────────────────────────────────────────────
const complaints = [
    {
        consumer_id: 'house3',
        consumer_name: 'House 3',
        meter_id: 'house3',
        issue: 'Meter reading shows unusually high units consumed. Bill seems incorrect.',
        category: 'billing',
        status: 'open',
        timestamp: Date.now() - 3 * 60 * 60 * 1000   // 3 hours ago
    },
    {
        consumer_id: 'house1',
        consumer_name: 'House 1',
        meter_id: 'house1',
        issue: 'Frequent voltage fluctuations affecting home appliances.',
        category: 'power_quality',
        status: 'open',
        timestamp: Date.now() - 6 * 60 * 60 * 1000   // 6 hours ago
    },
    {
        consumer_id: 'house5',
        consumer_name: 'House 5',
        meter_id: 'house5',
        issue: 'Solar panel data not being credited to my account balance.',
        category: 'net_metering',
        status: 'open',
        timestamp: Date.now() - 1 * 60 * 60 * 1000   // 1 hour ago
    },
    {
        consumer_id: 'house2',
        consumer_name: 'House 2',
        meter_id: 'house2',
        issue: 'Power outage for 2 hours on 9th April. Requesting compensation credit.',
        category: 'outage',
        status: 'resolved',
        resolved_at: Date.now() - 30 * 60 * 1000,    // resolved 30 min ago
        timestamp: Date.now() - 12 * 60 * 60 * 1000  // filed 12 hours ago
    }
];

// ── 4. UTILITY STATISTICS (initial seed) ─────────────────────────────────────
const utilityStatistics = {
    overview: {
        total_consumers: 6,
        total_energy_supplied: 639.10,
        total_revenue: 3841.40,
        average_power_factor: 0.943,
        voltage_quality_index: 0.98,
        frequency_quality_index: 0.99,
        grace_period_consumers: 0,
        overdue_consumers: 0,
        total_compensations_issued: 0
    }
};

// ── PUSH ALL TO FIREBASE ──────────────────────────────────────────────────────
async function seedDatabase() {
    console.log('\n🚀 Starting Firebase seed...\n');

    await db.ref('consumers').set(consumers);
    console.log('✅ consumers       — 6 households pushed (with command, solar, ToD fields)');

    await db.ref('tariff_rules').set(tariffRules);
    console.log('✅ tariff_rules    — Household, MSME, ToD + Net Metering config pushed');

    // Push complaints individually using push() to get auto-generated keys
    for (const complaint of complaints) {
        await db.ref('complaints').push(complaint);
    }
    console.log('✅ complaints      — 4 sample tickets pushed (3 open, 1 resolved)');

    await db.ref('utility_statistics').set(utilityStatistics);
    console.log('✅ utility_stats   — Overview snapshot pushed');

    // Seed initial event log entry
    await db.ref('event_logs').push({
        timestamp: Date.now(),
        consumer_id: 'SYSTEM',
        event_type: 'SYSTEM_INITIALIZED',
        description: 'Smart Energy Meter Dashboard initialized. All 6 meters online.'
    });
    console.log('✅ event_logs      — Initial system boot event pushed');

    console.log('\n🎉 All data successfully seeded to Firebase Realtime Database!');
    console.log('   Open your dashboard — all tabs should now be populated.\n');

    process.exit(0);
}

seedDatabase().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
