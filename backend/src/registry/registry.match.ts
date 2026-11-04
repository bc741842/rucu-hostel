// Pure helpers for comparing what a student types at sign-up with RUCU's
// official record. Kept free of Nest/Prisma so they are easy to test.

/** "RU/BCS /2024 /321" and "ru/bcs/2024/321" become the same key. */
export function normalizeRegNo(value: string): string {
  return (value ?? '').toUpperCase().replace(/\s+/g, '').trim();
}

function words(value: string): string[] {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Every word the student typed must be part of the registered name, and at
 * least two words are needed. Word order and a skipped middle name are fine.
 */
export function namesMatch(typed: string, registered: string): boolean {
  const t = words(typed);
  const r = new Set(words(registered));
  if (t.length < 2 || r.size === 0) return false;
  return t.every((w) => r.has(w));
}

const COURSE_NOISE = new Set([
  'bachelor', 'bachelors', 'of', 'in', 'and', 'the', 'degree', 'bsc', 'ba', 'b', 'sc',
]);

function courseCore(value: string): string {
  return words(value)
    .filter((w) => !COURSE_NOISE.has(w))
    .join(' ');
}

/** Equal, or one contains the other ("Computer Science" vs the full title). */
export function coursesMatch(typed: string, registered: string): boolean {
  const a = courseCore(typed);
  const b = courseCore(registered);
  if (a.length < 4 || b.length < 4) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export interface RegistryRecord {
  regNo: string;
  name: string;
  course: string;
  year: number;
}

export function detailsMatch(
  typed: { name: string; course: string; year: number },
  record: RegistryRecord,
): boolean {
  return (
    namesMatch(typed.name, record.name) &&
    coursesMatch(typed.course, record.course) &&
    Number(typed.year) === Number(record.year)
  );
}

// ---------------------------------------------------------------- CSV import

/** Minimal CSV parser: handles quoted fields, "" escapes and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',' || c === ';' || c === '\t') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

const HEADER_ALIASES: Record<string, string[]> = {
  regNo: ['regno', 'regnumber', 'registrationnumber', 'registrationno', 'reg'],
  name: ['name', 'fullname', 'studentname'],
  course: ['course', 'programme', 'program', 'degree'],
  year: ['year', 'yearofstudy', 'studyyear'],
  gender: ['gender', 'sex'],
};

const squash = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

export interface ParsedRegistry {
  records: (RegistryRecord & { gender: string | null })[];
  errors: string[];
}

export function parseRegistryCsv(text: string): ParsedRegistry {
  const rows = parseCsv(text);
  const errors: string[] = [];
  if (rows.length < 2) {
    return { records: [], errors: ['The file has no data rows.'] };
  }
  const header = rows[0].map(squash);
  const col: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    col[key] = header.findIndex((h) => aliases.includes(h));
  }
  const missing = ['regNo', 'name', 'course', 'year'].filter((k) => col[k] < 0);
  if (missing.length) {
    return {
      records: [],
      errors: [
        `Missing column(s): ${missing.join(', ')}. The first row must be: regNo,name,course,year,gender`,
      ],
    };
  }

  const seen = new Set<string>();
  const records: ParsedRegistry['records'] = [];
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const regNo = (r[col.regNo] ?? '').trim();
    const name = (r[col.name] ?? '').trim();
    const course = (r[col.course] ?? '').trim();
    const year = Number((r[col.year] ?? '').trim());
    const gender = col.gender >= 0 ? (r[col.gender] ?? '').trim().toLowerCase() : '';
    if (!regNo || !name || !course || !Number.isInteger(year) || year < 1 || year > 6) {
      errors.push(`Line ${line}: missing or invalid regNo, name, course or year (1-6).`);
      return;
    }
    const key = normalizeRegNo(regNo);
    if (seen.has(key)) {
      errors.push(`Line ${line}: ${regNo} appears more than once.`);
      return;
    }
    seen.add(key);
    records.push({
      regNo,
      name,
      course,
      year,
      gender: gender === 'male' || gender === 'female' ? gender : null,
    });
  });
  return { records, errors };
}
