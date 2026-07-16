import XLSX from 'xlsx';

const wb = XLSX.readFile('data/โยงประกาศ PDPA.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

console.log('Sheet name:', wb.SheetNames[0]);
console.log('Headers:', Object.keys(data[0]));
console.log('Total rows:', data.length);
console.log('---');
for (let i = 0; i < Math.min(data.length, 30); i++) {
  const row = {};
  for (const [k, v] of Object.entries(data[i])) {
    row[k] = typeof v === 'string' && v.length > 80 ? v.substring(0, 80) + '...' : v;
  }
  console.log(JSON.stringify(row, null, 2));
  console.log('---');
}
