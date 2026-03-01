import { Motor, Propeller, Battery, CalculationResult, Setup } from "../types";

/**
 * PropCalc Physics Engine
 * Simplified model for RC motor/propeller performance estimation.
 */

const AIR_DENSITY = 1.225; // kg/m^3 at sea level

export function calculateSetup(setup: Setup, throttle: number): CalculationResult {
  const { motor, propeller, battery } = setup;
  
  // 1. Voltage calculation (simplified)
  // Assume 3.7V nominal per cell, dropping slightly under load.
  // We'll use a more dynamic approach if we want to be fancy, 
  // but for a static calculator, we use nominal or full charge.
  const vBattNominal = battery.cells * 3.7;
  const vBatt = vBattNominal * (throttle / 100); // Simplified throttle effect on voltage
  
  // 2. Propeller Constants (Rough approximations for standard props)
  // Power = Cp * rho * n^3 * D^5
  // Thrust = Ct * rho * n^2 * D^4
  // D in meters, n in revs/sec
  const dMeters = propeller.diameter * 0.0254;
  const pMeters = propeller.pitch * 0.0254;
  
  // Empirical constants for standard propellers
  let Cp = 0.04 * (propeller.pitch / propeller.diameter); 
  let Ct = 0.10 * (propeller.pitch / propeller.diameter);

  // Adjust for blade count (baseline is 2 blades)
  if (propeller.blades > 2) {
    const bladeFactor = propeller.blades / 2;
    Cp *= Math.pow(bladeFactor, 0.85);
    Ct *= Math.pow(bladeFactor, 0.75);
  }

  // Adjust for propeller type
  if (propeller.type === "Toroidal") {
    Cp *= 1.15; // More drag/torque
    Ct *= 1.10; // Slightly more thrust
  }

  if (propeller.type === "Roswell Antigravity") {
    // Impossible physics for the Roswell drive
    return {
      throttle,
      voltage: 0,
      current: 0,
      powerIn: 0,
      powerOut: 0,
      efficiency: 999.9,
      rpm: 0,
      thrust: 999999,
      pitchSpeed: 999999,
      estimatedTopSpeed: 999999,
      flightTime: 9999
    };
  }

  // 3. Iterative solver to find RPM and Current
  // We need to find I such that Motor Torque = Prop Torque
  // Motor Torque (Nm) = (I - Io) * 60 / (2 * PI * Kv)
  // Prop Torque (Nm) = Power / (2 * PI * n) = (Cp * rho * n^3 * D^5) / (2 * PI * n) = Cp * rho * n^2 * D^5 / (2 * PI)
  
  let current = 2.0; // Initial guess
  let rpm = 0;
  let powerIn = 0;
  let powerOut = 0;
  let efficiency = 0;
  
  // Simple iterative convergence (10 steps is usually enough for this linear-ish system)
  for (let i = 0; i < 15; i++) {
    const vEffective = vBatt - (current * (motor.internalResistance + 0.01)); // 0.01 for ESC/wiring
    rpm = Math.max(0, motor.kv * (vEffective - (current * motor.internalResistance)));
    const n = rpm / 60; // revs per second
    
    // Prop Torque required
    const torqueProp = (Cp * AIR_DENSITY * Math.pow(n, 2) * Math.pow(dMeters, 5)) / (2 * Math.PI);
    
    // Motor Current required for that torque
    // Torque = (I - Io) * Kt => I = Torque/Kt + Io
    const kt = 60 / (2 * Math.PI * motor.kv);
    current = (torqueProp / kt) + motor.noLoadCurrent;
    
    if (current > motor.maxCurrent * 1.5) break; // Sanity check
  }

  powerIn = vBatt * current;
  powerOut = (2 * Math.PI * (rpm / 60)) * ((current - motor.noLoadCurrent) * (60 / (2 * Math.PI * motor.kv)));
  efficiency = powerIn > 0 ? (powerOut / powerIn) * 100 : 0;
  
  // 4. Thrust Calculation
  // Thrust (N) = Ct * rho * n^2 * D^4
  const n = rpm / 60;
  const thrustN = Ct * AIR_DENSITY * Math.pow(n, 2) * Math.pow(dMeters, 4);
  const thrustGrams = thrustN * 101.97; // 1N approx 101.97g
  
  // 5. Pitch Speed
  // Pitch Speed = RPM * Pitch
  const pitchSpeedKmh = (rpm * propeller.pitch * 0.0254 * 60) / 1000;

  // 6. Estimated Top Speed (Level Flight)
  // Depends on airframe drag.
  let dragFactor = 0.75; // Standard
  if (setup.airframeType === "Streamlined") dragFactor = 0.85;
  if (setup.airframeType === "Draggy") dragFactor = 0.60;
  const estimatedTopSpeed = pitchSpeedKmh * dragFactor;

  // 7. Flight Time
  // Capacity (mAh) / Current (A) * 60 / 1000
  const flightTime = current > 0 ? (battery.capacity / current) * (60 / 1000) : 0;

  return {
    throttle,
    voltage: vBatt,
    current,
    powerIn,
    powerOut,
    efficiency,
    rpm,
    thrust: thrustGrams,
    pitchSpeed: pitchSpeedKmh,
    estimatedTopSpeed,
    flightTime
  };
}

export function generatePerformanceData(setup: Setup): CalculationResult[] {
  const data: CalculationResult[] = [];
  for (let t = 10; t <= 100; t += 10) {
    data.push(calculateSetup(setup, t));
  }
  return data;
}
