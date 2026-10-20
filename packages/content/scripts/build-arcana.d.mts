export function collectArcana(dir: string): Record<string, string>;
export function collectPositions(file: string): { positions: string };
export function collectNatalPlanets(file: string): { planets: string };
export function collectLila(file: string): { cells: string };
export function collectArticles(dir: string): Record<string, string>;
export function collectNatalKeys(dir: string): Record<string, string>;
export function natalSummary(source: string): string;
