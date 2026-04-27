const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(/export type DayOfWeek = .*/g, "export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';");
content = content.replace(/export const DAYS: DayOfWeek\[\] = .*/g, "export const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];");
fs.writeFileSync('src/types.ts', content);
