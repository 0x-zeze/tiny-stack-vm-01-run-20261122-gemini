import {readdirSync, readFileSync, writeFileSync, mkdirSync} from "node:fs";
const IN = process.env.MAKEFUN_INPUT_DIR || "/input";
const OU = process.env.MAKEFUN_OUTPUT_DIR || "/output";
function die(c: number): never { throw c; }
function run(p: Buffer, inp: Buffer) {
  const s = new Int32Array(256), r = new Int32Array(64), m = new Int32Array(256), o = new Uint8Array(65536);
  const s16 = (i: number) => ((p[i] | (p[i + 1] << 8)) << 16) >> 16;
  let sp = 0, rp = 0, ol = 0, ip = 0, pc = 0, st = 0;
  const n = p.length;
  try {
    for (;;) {
      if (st === 1000000) die(10);
      if (pc < 0 || pc >= n) die(9);
      const op = p[pc];
      if (!(op < 8 || (op >= 16 && op <= 34) || (op >= 48 && op <= 52) || op === 64 || op === 65 || (op >= 80 && op <= 83))) die(5);
      let im = 0;
      if (op === 1) im = 1; else if (op === 2) im = 4; else if (op >= 48 && op <= 51) im = 2;
      if (pc + im >= n) die(9);
      let po = 0, pu = 0;
      if (op === 7) po = 3;
      else if (op === 5 || op === 6 || op === 65) po = 2;
      else if (op >= 16 && op <= 22) po = 2;
      else if (op >= 24 && op <= 26) po = 2;
      else if (op >= 28 && op <= 30) po = 2;
      else if (op >= 32 && op <= 34) po = 2;
      else if (op === 3 || op === 4 || op === 23 || op === 27 || op === 49 || op === 50 || op === 64 || op === 80 || op === 81 || op === 83) po = 1;
      if (op === 6 || op === 7) pu = 3;
      else if (op === 4 || op === 5) pu = 2;
      else if (op === 1 || op === 2 || op === 82) pu = 1;
      else if (op >= 16 && op <= 23) pu = 1;
      else if (op >= 24 && op <= 27) pu = 1;
      else if (op >= 28 && op <= 30) pu = 1;
      else if (op >= 32 && op <= 34) pu = 1;
      else if (op === 64) pu = 1;
      if (sp < po) die(2);
      if (sp - po + pu > 256) die(3);
      st++;
      const nx = pc + 1 + im;
      pc = nx;
      switch (op) {
        case 0: return {e: 0, o, l: ol};
        case 1: s[sp++] = (p[nx - 1] << 24) >> 24; break;
        case 2: s[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
        case 3: sp--; break;
        case 4: s[sp] = s[sp - 1]; sp++; break;
        case 5: { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; break; }
        case 6: s[sp] = s[sp - 2]; sp++; break;
        case 7: { const t = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = t; break; }
        case 16: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] + b) | 0; break; }
        case 17: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] - b) | 0; break; }
        case 18: { const b = s[--sp]; s[sp - 1] = Math.imul(s[sp - 1], b); break; }
        case 19: { const b = s[sp - 1], a = s[sp - 2]; if (b === 0) die(4); sp--; s[sp - 1] = (a / b) | 0; break; }
        case 20: { const b = s[sp - 1], a = s[sp - 2]; if (b === 0) die(4); sp--; s[sp - 1] = a % b; break; }
        case 21: { const b = s[sp - 1], a = s[sp - 2]; if (b === 0) die(4); sp--; s[sp - 1] = ((a >>> 0) / (b >>> 0)) | 0; break; }
        case 22: { const b = s[sp - 1], a = s[sp - 2]; if (b === 0) die(4); sp--; s[sp - 1] = ((a >>> 0) % (b >>> 0)) | 0; break; }
        case 23: s[sp - 1] = (-s[sp - 1]) | 0; break;
        case 24: { const b = s[--sp]; s[sp - 1] = s[sp - 1] & b; break; }
        case 25: { const b = s[--sp]; s[sp - 1] = s[sp - 1] | b; break; }
        case 26: { const b = s[--sp]; s[sp - 1] = s[sp - 1] ^ b; break; }
        case 27: s[sp - 1] = ~s[sp - 1]; break;
        case 28: { const b = s[--sp]; s[sp - 1] = s[sp - 1] << (b & 31); break; }
        case 29: { const b = s[--sp]; s[sp - 1] = s[sp - 1] >> (b & 31); break; }
        case 30: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] >>> (b & 31)) | 0; break; }
        case 32: { const b = s[--sp]; s[sp - 1] = s[sp - 1] === b ? 1 : 0; break; }
        case 33: { const b = s[--sp]; s[sp - 1] = s[sp - 1] < b ? 1 : 0; break; }
        case 34: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] >>> 0) < (b >>> 0) ? 1 : 0; break; }
        case 48: pc = nx + s16(nx - 2); break;
        case 49: { const v = s[--sp]; if (v === 0) pc = nx + s16(nx - 2); break; }
        case 50: { const v = s[--sp]; if (v !== 0) pc = nx + s16(nx - 2); break; }
        case 51: { if (rp === 64) die(7); r[rp++] = nx; pc = p[nx - 2] | (p[nx - 1] << 8); break; }
        case 52: { if (rp === 0) die(8); pc = r[--rp]; break; }
        case 64: { const a = s[sp - 1]; if (a < 0 || a > 255) die(6); s[sp - 1] = m[a]; break; }
        case 65: { const a = s[sp - 1], v = s[sp - 2]; if (a < 0 || a > 255) die(6); sp -= 2; m[a] = v; break; }
        case 80: { const v = s[--sp]; const t = String(v); if (ol + t.length > 65536) die(11); for (let i = 0; i < t.length; i++) o[ol++] = t.charCodeAt(i); break; }
        case 81: { const v = s[--sp]; if (ol + 1 > 65536) die(11); o[ol++] = v & 255; break; }
        case 82: s[sp++] = ip < inp.length ? inp[ip++] : -1; break;
        case 83: { const v = s[--sp]; return {e: v & 255, o, l: ol}; }
      }
    }
  } catch (e) {
    return {e: e as number, o, l: ol};
  }
}
const ids = readdirSync(IN, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name).sort();
for (const id of ids) {
  const prog = readFileSync(IN + "/" + id + "/program.bin");
  const inp = readFileSync(IN + "/" + id + "/input.bin");
  const res = run(prog, inp);
  const dst = OU + "/" + id;
  mkdirSync(dst, {recursive: true});
  writeFileSync(dst + "/stdout.bin", res.o.subarray(0, res.l));
  writeFileSync(dst + "/exit.txt", String(res.e));
}
