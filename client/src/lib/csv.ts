/**
 * CSV pro český Excel: UTF-8 s BOM (jinak rozbije diakritiku), středník jako oddělovač, CRLF.
 * Ochrana proti CSV/formula injection: buňka začínající = + - @ (nebo tab/CR) dostane apostrof,
 * aby ji Excel nevykonal jako vzorec — data jsou z veřejného formuláře.
 */

const cell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (rows: string[][]) => `﻿${rows.map((row) => row.map(cell).join(';')).join('\r\n')}\r\n`;
