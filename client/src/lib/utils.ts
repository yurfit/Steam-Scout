import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getEngineColor(engine: string) {
  switch(engine.toLowerCase()) {
    case 'unity': return 'bg-white text-black border-white';
    case 'unreal': return 'bg-[#0E1128] text-white border-blue-500';
    case 'custom': return 'bg-purple-900 text-purple-100 border-purple-500';
    case 'godot': return 'bg-blue-900 text-blue-100 border-blue-400';
    default: return 'bg-secondary text-muted-foreground border-transparent';
  }
}

export const STATUS_COLUMNS = [
  { id: 'new', label: 'New Lead', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { id: 'interested', label: 'Interested', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { id: 'closed', label: 'Closed', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
];
