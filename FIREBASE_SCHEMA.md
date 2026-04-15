# Smart Energy Meter - Firebase Schema Documentation

This document outlines the **Firebase Realtime Database (RTDB)** structure, field types, and the logic used for fetching and pushing data in the Smart Energy Dashboard. Use this as a reference to ensure variable consistency between applications.

---

## 1. Consumer Metadata (`/consumers`)
This node stores static and semi-static information about each consumer/meter.

**Path:** `consumers/{consumer_id}` (e.g., `consumers/house1`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Display name (e.g., "House 1") |
| `category` | `string` | `household` or `msme` (affects tariff slab application) |
| `meter_id` | `string` | Unique identifier for the hardware/simulated meter |
| `connected_load`| `number` | Load capacity in kW |
| `solar_connection`| `boolean`| `true` if Net Metering is active for this house |
| `current_balance`| `number` | Remaining prepaid balance (Currency) |
| `credit_score` | `number` | Score based on usage/PF (affects rewards/tier) |
| `status` | `string` | `active`, `suspended`, or `grace_period` |
| `command` | `string` | `ON` or `OFF`. Meter hardware should poll this for remote disconnect. |
| `total_units` | `number` | Lifetime energy consumed in kWh |
| `pf_history` | `number` | Recent average Power Factor |
| `penalties` | `number` | Total monetary penalties accumulated |
| `grace_period_start`| `number/null`| Timestamp when balance hit zero (if in grace period) |
| `installation_date`| `string` | YYYY-MM-DD format |

---

## 2. Live Meter Readings (`/readings` & `/meter`)
Real-time electrical parameters.

### Simulated Readings (`/readings`)
The simulator pushes the **latest** state of all simulated houses here.
**Path:** `readings/{house_id}` (e.g., `readings/house2`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `voltage` | `number` | Volts (V) |
| `current` | `number` | Amperes (A) |
| `power` | `number` | Active Power in Watts (W) |
| `energy` | `number` | Cumulative Energy in kWh |
| `pf` | `number` | Power Factor (0.0 to 1.0) |
| `frequency` | `number` | Frequency in Hz (e.g., 50.0) |
| `timestamp` | `number` | Epoch timestamp (ms/s) |

### Hardware Meter (`/meter`)
Reserved for real IoT hardware (typically mapped to `house6` in the dashboard).
**Path:** `meter/`

| Field | Type | Description |
| :--- | :--- | :--- |
| `voltage` | `number` | V |
| `current` | `number` | A |
| `activePower` | `number` | W |
| `energy` | `number` | kWh |
| `pf` | `number` | Power Factor |
| `frequency` | `number` | Hz |

---

## 3. Global Configuration (`/tariff_rules`)
Universal settings used by the billing engines.

| Node | Fields |
| :--- | :--- |
| `household_tariffs`| `slab1_limit`, `slab1_rate`, `slab2_limit`, `slab2_rate`, `slab3_rate` |
| `msme_tariffs` | `slab1_limit`, `slab1_rate` ... `slab4_rate` |
| `tod_tariff` | `enabled`, `peak_start_hour` (18), `peak_end_hour` (22), `peak_multiplier` (1.5), `night_multiplier` (0.75) |
| `power_factor_rules`| `pf_penalty_1` (0.90), `pf_penalty_1_charge` (0.02 - 2%), `pf_penalty_2` (0.85), `pf_penalty_2_charge` (0.05 - 5%) |
| `net_metering` | `enabled`, `buyback_rate` (e.g., 0.80 for 80% credit) |

---

## 4. Operational Logs & Tickets

### Event Logs (`/event_logs`)
System-wide alerts (Voltage Swells, Sags, Tripping events).
**Path:** `event_logs/{push_id}`
- `timestamp`: Server Timestamp
- `consumer_id`: Consumer ID (or "SYSTEM")
- `event_type`: e.g., `VOLTAGE_SWELL`, `LOW_PF`, `DISCONNECT`
- `description`: Human-readable log string

### Complaints (`/complaints`)
Customer support tickets.
**Path:** `complaints/{push_id}`
- `consumer_id`: string
- `issue`: string
- `category`: `billing`, `power_quality`, `net_metering`, `outage`
- `status`: `open` or `resolved`
- `timestamp`: Epoch

### Notifications (`/notifications`)
Push alerts for consumer dashboard/mobile app.
**Path:** `notifications/{push_id}`
- `consumer_id`: string
- `notification_type`: `LOW_BALANCE_WARNING`, `DISCONNECT_ALERT`
- `message`: string
- `status`: `unread` or `read`

---

## 5. Fetching/Pushing Logic (Javascript Reference)

### Fetching (Live Update)
```javascript
// Listening to a specific house
db.ref("readings/house1").on("value", (snapshot) => {
    const data = snapshot.val();
    console.log("Voltage:", data.voltage);
});
```

### Pushing (New Log/Complaint)
```javascript
// Adding a system event
db.ref("event_logs").push({
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    consumer_id: "house1",
    event_type: "ALERT",
    description: "Manual override triggered"
});
```

### Updating (Balance/Command)
```javascript
// Remote disconnect
db.ref("consumers/house1").update({
    command: "OFF",
    status: "suspended"
});
```
