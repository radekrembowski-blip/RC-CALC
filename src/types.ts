export interface Motor {
  id: string;
  brand: string;
  model: string;
  kv: number;
  weight: number; // grams
  internalResistance: number; // ohms
  noLoadCurrent: number; // amps
  noLoadVoltage: number; // volts
  maxCurrent: number; // amps
  maxPower: number; // watts
}

export type PropellerType = "Standard" | "Toroidal" | "Roswell Antigravity";

export interface Propeller {
  diameter: number; // inches
  pitch: number; // inches
  blades: number;
  type: PropellerType;
  constant: number; // P-const, usually 1.0 for standard props
}

export interface Battery {
  cells: number; // S count
  capacity: number; // mAh
  dischargeRate: number; // C
}

export interface ESC {
  maxCurrent: number; // amps
  weight: number; // grams
}

export type AirframeType = "Streamlined" | "Standard" | "Draggy";

export interface CalculationResult {
  throttle: number; // 0-100
  voltage: number;
  current: number;
  powerIn: number;
  powerOut: number;
  efficiency: number;
  rpm: number;
  thrust: number; // grams
  pitchSpeed: number; // km/h
  estimatedTopSpeed: number; // km/h
  motorTemp?: number; // estimated
  flightTime?: number; // minutes
}

export interface Setup {
  motor: Motor;
  propeller: Propeller;
  battery: Battery;
  esc: ESC;
  totalWeight: number; // grams (AUW)
  airframeType: AirframeType;
}
