"use client";

// Shared Circuit Breaker state
// This survives as long as the module is loaded in the browser session
const STATE = {
    lastErrorTimestamp: 0,
    cooldownMs: 300000, // 5 minutes default
};

export const checkCircuitBreaker = () => {
    if (Date.now() - STATE.lastErrorTimestamp < STATE.cooldownMs) {
        const remaining = Math.ceil((STATE.cooldownMs - (Date.now() - STATE.lastErrorTimestamp)) / 1000);
        throw new Error(`Quota limit circuit breaker active. Retry in ${remaining}s.`);
    }
};

export const tripCircuitBreaker = (error) => {
    console.error("Tripping circuit breaker due to error:", error);
    // Only trip on resource exhausted or quota errors, but honestly any error in count might suggest issues
    if (error?.code === "resource-exhausted" || error?.message?.includes("Quota")) {
        STATE.lastErrorTimestamp = Date.now();
        STATE.cooldownMs = 600000; // Increase to 10 minutes for severe errors
    } else {
        // For other errors, maybe shorter cooldown
        STATE.lastErrorTimestamp = Date.now();
        STATE.cooldownMs = 60000; // 1 minute
    }
};
