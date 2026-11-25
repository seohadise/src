import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getHeatingPersianName = (type) => {
  const heatingMap = {
    "gas-heater": "بخاری گازی",
    "electric-heater": "بخاری برقی",
    radiator: "رادیاتور",
    "electric-fan": "فن کویل",
    fireplace: "شومینه",
    "fan-coil": "فن کویل",
    other: "سایر",
  };
  return heatingMap[type] || type;
};

export const getCoolingPersianName = (type) => {
  const coolingMap = {
    "water-cooler": "کولر آبی",
    "gas-cooler": "کولر گازی",
    "split-unit": "اسپلیت",
    "ceiling-fan": "پنکه سقفی",
    "regular-fan": "پنکه معمولی",
  };
  return coolingMap[type] || type;
};
