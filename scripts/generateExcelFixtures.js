// Regenerates src/data/datasets/excel/*.xlsx from the equivalent CSV fixture, so Excel and CSV
// datasets never drift. Run with `npm run data:build-excel` after editing a CSV fixture.
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const XLSX = require("xlsx");

const csvDir = path.resolve(__dirname, "../src/data/datasets/csv");
const excelDir = path.resolve(__dirname, "../src/data/datasets/excel");

fs.mkdirSync(excelDir, { recursive: true });

for (const file of fs.readdirSync(csvDir)) {
  if (!file.endsWith(".csv")) continue;

  const rows = parse(fs.readFileSync(path.join(csvDir, file), "utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const outFile = path.join(excelDir, file.replace(/\.csv$/, ".xlsx"));
  XLSX.writeFile(workbook, outFile);
  console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
}
