import * as fs from 'fs';
import * as path from 'path';
import { parseScheduleFile } from './services/scheduleParser';

async function test() {
  const pdfDir = path.join(process.cwd(), 'horarios-de-prueba');
  const files = fs.readdirSync(pdfDir).filter((f: string) => f.endsWith('.pdf')).sort();
  
  console.log(`\n🔍 Testing REAL parser with ${files.length} PDFs...\n`);
  
  for (const file of files) {
    console.log('='.repeat(70));
    console.log(`📄 ${file}`);
    console.log('='.repeat(70));
    
    const pdfPath = path.join(pdfDir, file);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64 = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');
    
    try {
      const result = await parseScheduleFile(base64, 'application/pdf');
      
      console.log(`\n  📋 Facultad: ${result.faculty}`);
      console.log(`  📋 Período: ${result.academic_period}`);
      console.log(`  📋 Sesiones totales: ${result.sessions.length}\n`);
      
      // Group by subject
      const subjects = new Map<string, typeof result.sessions>();
      for (const s of result.sessions) {
        const key = s.subject;
        if (!subjects.has(key)) subjects.set(key, []);
        subjects.get(key)!.push(s);
      }
      
      for (const [subject, sessions] of subjects) {
        console.log(`  ┌─ ${subject}`);
        console.log(`  │  Docente: ${sessions[0].teacher}`);
        if (sessions[0].subject_faculty) console.log(`  │  Depto: ${sessions[0].subject_faculty}`);
        for (const s of sessions) {
          const dayEs: Record<string, string> = { Monday: 'LUN', Tuesday: 'MAR', Wednesday: 'MIÉ', Thursday: 'JUE', Friday: 'VIE' };
          console.log(`  │  📅 ${dayEs[s.day] || s.day} ${s.startTime}-${s.endTime} → ${s.location}`);
        }
        console.log(`  └─\n`);
      }
    } catch (err: any) {
      console.error(`  ❌ ERROR: ${err.message}`);
    }
  }
}

test().catch(console.error);
