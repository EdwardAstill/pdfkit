#!/usr/bin/env bun

import { PDFDocument } from "pdf-lib";
import { resolve, basename, dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import {
  extractPages,
  combineDocuments,
  rotatePages,
  splitDocument,
  imposeNup,
  imposeBooklet,
  getPdfInfo,
} from "../src/lib/pdfOperations";
import { parsePageRange } from "../src/lib/pageRange";

const USAGE = `pk — PDF operations CLI

Usage:
  pk extract <input> <pages> [-o output]     Extract pages (e.g. "1,3,5-8")
  pk combine <file1> <file2> ... [-o output] Merge PDFs into one
  pk rotate <input> <angle> [-o output]      Rotate pages (90, 180, 270)
     [--pages 1,3,5-8]                       (default: all pages)
  pk split <input> --every <n> [-o dir]      Split every N pages
  pk impose <input> [-o output]              N-up imposition
     --cols <n> --rows <n> [--landscape]
  pk booklet <input> [-o output]             Saddle-stitch booklet layout
  pk info <input>                            Show PDF metadata
  pk count <input>                           Print page count

Options:
  -o, --output <path>   Output file or directory (default: <input>-<op>.pdf)
  -h, --help            Show this help
`;

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function getOutput(args: string[], input: string, suffix: string): string {
  return getArg(args, "-o") ?? getArg(args, "--output") ?? defaultOutput(input, suffix);
}

function defaultOutput(input: string, suffix: string): string {
  const base = basename(input, ".pdf");
  const dir = dirname(input);
  return join(dir, `${base}-${suffix}.pdf`);
}

async function readPdf(path: string): Promise<Uint8Array> {
  const file = Bun.file(resolve(path));
  if (!(await file.exists())) die(`file not found: ${path}`);
  return new Uint8Array(await file.arrayBuffer());
}

async function writePdf(path: string, bytes: Uint8Array): Promise<void> {
  await Bun.write(resolve(path), bytes);
  console.log(`wrote ${path} (${(bytes.length / 1024).toFixed(0)} KB)`);
}

// --- Commands ---

async function cmdExtract(args: string[]) {
  const input = args[0];
  const spec = args[1];
  if (!input || !spec) die("usage: pk extract <input> <pages>");
  const bytes = await readPdf(input);
  const doc = await PDFDocument.load(bytes);
  const indices = parsePageRange(spec, doc.getPageCount());
  if (indices.length === 0) die(`no valid pages in range "${spec}" (document has ${doc.getPageCount()} pages)`);
  const result = await extractPages(bytes, indices);
  await writePdf(getOutput(args, input, "extract"), result);
}

async function cmdCombine(args: string[]) {
  const outIdx = args.indexOf("-o") !== -1 ? args.indexOf("-o") : args.indexOf("--output");
  const files = outIdx === -1 ? args : args.slice(0, outIdx);
  if (files.length < 2) die("usage: pk combine <file1> <file2> ... [-o output]");
  const bytesArr = await Promise.all(files.map(readPdf));
  const result = await combineDocuments(bytesArr);
  const output = getArg(args, "-o") ?? getArg(args, "--output") ?? "combined.pdf";
  await writePdf(output, result);
}

async function cmdRotate(args: string[]) {
  const input = args[0];
  const angleStr = args[1];
  if (!input || !angleStr) die("usage: pk rotate <input> <angle> [--pages 1,3]");
  const angle = parseInt(angleStr, 10);
  if (![90, 180, 270].includes(angle)) die("angle must be 90, 180, or 270");
  const bytes = await readPdf(input);
  const doc = await PDFDocument.load(bytes);
  const total = doc.getPageCount();
  const pagesSpec = getArg(args, "--pages");
  const indices = pagesSpec ? parsePageRange(pagesSpec, total) : Array.from({ length: total }, (_, i) => i);
  const result = await rotatePages(bytes, indices, angle);
  await writePdf(getOutput(args, input, `rot${angle}`), result);
}

async function cmdSplit(args: string[]) {
  const input = args[0];
  if (!input) die("usage: pk split <input> --every <n> [-o dir]");
  const everyStr = getArg(args, "--every");
  if (!everyStr) die("--every <n> is required");
  const every = parseInt(everyStr, 10);
  if (isNaN(every) || every < 1) die("--every must be a positive number");
  const bytes = await readPdf(input);
  const results = await splitDocument(bytes, every);
  const outDir = getArg(args, "-o") ?? getArg(args, "--output") ?? dirname(input);
  const base = basename(input, ".pdf");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  for (const { bytes: chunk, label } of results) {
    await writePdf(join(outDir, `${base}-${label}.pdf`), chunk);
  }
}

async function cmdImpose(args: string[]) {
  const input = args[0];
  if (!input) die("usage: pk impose <input> --cols <n> --rows <n> [--landscape]");
  const colsStr = getArg(args, "--cols");
  const rowsStr = getArg(args, "--rows");
  if (!colsStr || !rowsStr) die("--cols and --rows are required");
  const cols = parseInt(colsStr, 10);
  const rows = parseInt(rowsStr, 10);
  if (isNaN(cols) || isNaN(rows) || cols < 1 || rows < 1) die("--cols and --rows must be positive numbers");
  const landscape = hasFlag(args, "--landscape");
  const bytes = await readPdf(input);
  const result = await imposeNup(bytes, cols, rows, landscape);
  await writePdf(getOutput(args, input, `${cols}x${rows}`), result);
}

async function cmdBooklet(args: string[]) {
  const input = args[0];
  if (!input) die("usage: pk booklet <input> [-o output]");
  const bytes = await readPdf(input);
  const result = await imposeBooklet(bytes);
  await writePdf(getOutput(args, input, "booklet"), result);
}

async function cmdInfo(args: string[]) {
  const input = args[0];
  if (!input) die("usage: pk info <input>");
  const bytes = await readPdf(input);
  const doc = await PDFDocument.load(bytes);
  const info = getPdfInfo(doc);
  console.log(`File:     ${input}`);
  console.log(`Pages:    ${info.pageCount}`);
  console.log(`Size:     ${info.width} x ${info.height} pts`);
  if (info.title) console.log(`Title:    ${info.title}`);
  if (info.author) console.log(`Author:   ${info.author}`);
  if (info.creator) console.log(`Creator:  ${info.creator}`);
  if (info.producer) console.log(`Producer: ${info.producer}`);
  if (info.creationDate) console.log(`Created:  ${info.creationDate}`);
  if (info.modDate) console.log(`Modified: ${info.modDate}`);
}

async function cmdCount(args: string[]) {
  const input = args[0];
  if (!input) die("usage: pk count <input>");
  const bytes = await readPdf(input);
  const doc = await PDFDocument.load(bytes);
  console.log(doc.getPageCount());
}

// --- Main ---

const args = process.argv.slice(2);
const command = args[0];
const rest = args.slice(1);

if (!command || command === "-h" || command === "--help") {
  console.log(USAGE);
  process.exit(0);
}

const commands: Record<string, (args: string[]) => Promise<void>> = {
  extract: cmdExtract,
  combine: cmdCombine,
  rotate: cmdRotate,
  split: cmdSplit,
  impose: cmdImpose,
  booklet: cmdBooklet,
  info: cmdInfo,
  count: cmdCount,
};

const fn = commands[command];
if (!fn) die(`unknown command: ${command}\nRun 'pk --help' for usage.`);
await fn(rest);
