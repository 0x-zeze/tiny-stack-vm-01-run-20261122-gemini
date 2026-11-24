const fs = process.getBuiltinModule('fs');

const OP_META = new Uint8Array(256);
for (const [op, imm, pops, pushes] of [
  [0x00, 0, 0, 0], [0x01, 1, 0, 1], [0x02, 4, 0, 1], [0x03, 0, 1, 0],
  [0x04, 0, 1, 2], [0x05, 0, 2, 2], [0x06, 0, 2, 3], [0x07, 0, 3, 3],
  [0x10, 0, 2, 1], [0x11, 0, 2, 1], [0x12, 0, 2, 1], [0x13, 0, 2, 1],
  [0x14, 0, 2, 1], [0x15, 0, 2, 1], [0x16, 0, 2, 1], [0x17, 0, 1, 1],
  [0x18, 0, 2, 1], [0x19, 0, 2, 1], [0x1a, 0, 2, 1], [0x1b, 0, 1, 1],
  [0x1c, 0, 2, 1], [0x1d, 0, 2, 1], [0x1e, 0, 2, 1], [0x20, 0, 2, 1],
  [0x21, 0, 2, 1], [0x22, 0, 2, 1], [0x30, 2, 0, 0], [0x31, 2, 1, 0],
  [0x32, 2, 1, 0], [0x33, 2, 0, 0], [0x34, 0, 0, 0], [0x40, 0, 1, 1],
  [0x41, 0, 2, 0], [0x50, 0, 1, 0], [0x51, 0, 1, 0], [0x52, 0, 0, 1],
  [0x53, 0, 1, 0]
]) {
  OP_META[op] = 0x80 | (imm << 4) | (pops << 2) | pushes;
}

function executeProgram(prog, inp) {
  const plen = prog.length;
  const ilen = inp.length;
  const stk = new Int32Array(256);
  const ret = new Int32Array(64);
  const mem = new Int32Array(256);
  const out = new Uint8Array(65536);
  let sp = 0;
  let csp = 0;
  let olen = 0;
  let ipos = 0;
  let pc = 0;
  let steps = 0;

  function finish(code) {
    return { stdout: out.slice(0, olen), exit: code };
  }

  while (true) {
    if (steps === 1000000) return finish(10);
    if (pc < 0 || pc >= plen) return finish(9);
    const op = prog[pc];
    const meta = OP_META[op];
    if (!meta) return finish(5);
    const imm = (meta >> 4) & 7;
    const pops = (meta >> 2) & 3;
    const pushes = meta & 3;
    if (pc + imm >= plen) return finish(9);
    steps++;
    if (sp < pops) return finish(2);
    if (sp - pops + pushes > 256) return finish(3);
    const nextPc = pc + 1 + imm;
    pc = nextPc;

    switch (op) {
      case 0x00:
        return finish(0);
      case 0x01:
        stk[sp++] = (prog[nextPc - 1] << 24) >> 24;
        break;
      case 0x02:
        stk[sp++] =
          prog[nextPc - 4] |
          (prog[nextPc - 3] << 8) |
          (prog[nextPc - 2] << 16) |
          (prog[nextPc - 1] << 24);
        break;
      case 0x03:
        sp--;
        break;
      case 0x04:
        stk[sp] = stk[sp - 1];
        sp++;
        break;
      case 0x05: {
        const tmp = stk[sp - 1];
        stk[sp - 1] = stk[sp - 2];
        stk[sp - 2] = tmp;
        break;
      }
      case 0x06:
        stk[sp] = stk[sp - 2];
        sp++;
        break;
      case 0x07: {
        const bottom = stk[sp - 3];
        stk[sp - 3] = stk[sp - 2];
        stk[sp - 2] = stk[sp - 1];
        stk[sp - 1] = bottom;
        break;
      }
      case 0x10: {
        const b = stk[--sp];
        stk[sp - 1] = (stk[sp - 1] + b) | 0;
        break;
      }
      case 0x11: {
        const b = stk[--sp];
        stk[sp - 1] = (stk[sp - 1] - b) | 0;
        break;
      }
      case 0x12: {
        const b = stk[--sp];
        stk[sp - 1] = Math.imul(stk[sp - 1], b);
        break;
      }
      case 0x13: {
        const b = stk[sp - 1];
        const a = stk[sp - 2];
        if (b === 0) return finish(4);
        sp--;
        stk[sp - 1] = a === -2147483648 && b === -1 ? -2147483648 : (a / b) | 0;
        break;
      }
      case 0x14: {
        const b = stk[sp - 1];
        const a = stk[sp - 2];
        if (b === 0) return finish(4);
        sp--;
        stk[sp - 1] = b === -1 ? 0 : (a % b) | 0;
        break;
      }
      case 0x15: {
        const b = stk[sp - 1];
        const a = stk[sp - 2];
        if (b === 0) return finish(4);
        sp--;
        stk[sp - 1] = Math.floor((a >>> 0) / (b >>> 0)) | 0;
        break;
      }
      case 0x16: {
        const b = stk[sp - 1];
        const a = stk[sp - 2];
        if (b === 0) return finish(4);
        sp--;
        stk[sp - 1] = ((a >>> 0) % (b >>> 0)) | 0;
        break;
      }
      case 0x17:
        stk[sp - 1] = -stk[sp - 1] | 0;
        break;
      case 0x18: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] & b;
        break;
      }
      case 0x19: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] | b;
        break;
      }
      case 0x1a: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] ^ b;
        break;
      }
      case 0x1b:
        stk[sp - 1] = ~stk[sp - 1];
        break;
      case 0x1c: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] << (b & 31);
        break;
      }
      case 0x1d: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] >> (b & 31);
        break;
      }
      case 0x1e: {
        const b = stk[--sp];
        stk[sp - 1] = (stk[sp - 1] >>> (b & 31)) | 0;
        break;
      }
      case 0x20: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] === b ? 1 : 0;
        break;
      }
      case 0x21: {
        const b = stk[--sp];
        stk[sp - 1] = stk[sp - 1] < b ? 1 : 0;
        break;
      }
      case 0x22: {
        const b = stk[--sp];
        stk[sp - 1] = (stk[sp - 1] >>> 0) < (b >>> 0) ? 1 : 0;
        break;
      }
      case 0x30:
      case 0x31:
      case 0x32: {
        const off = ((prog[nextPc - 2] | (prog[nextPc - 1] << 8)) << 16) >> 16;
        if (op === 0x30 || (op === 0x31 ? stk[--sp] === 0 : stk[--sp] !== 0)) pc = nextPc + off;
        break;
      }
      case 0x33: {
        if (csp === 64) return finish(7);
        ret[csp++] = nextPc;
        pc = prog[nextPc - 2] | (prog[nextPc - 1] << 8);
        break;
      }
      case 0x34: {
        if (csp === 0) return finish(8);
        pc = ret[--csp];
        break;
      }
      case 0x40: {
        const addr = stk[sp - 1];
        if (addr < 0 || addr > 255) return finish(6);
        stk[sp - 1] = mem[addr];
        break;
      }
      case 0x41: {
        const addr = stk[sp - 1];
        const val = stk[sp - 2];
        if (addr < 0 || addr > 255) return finish(6);
        sp -= 2;
        mem[addr] = val;
        break;
      }
      case 0x50: {
        const text = String(stk[sp - 1]);
        const tlen = text.length;
        if (olen + tlen > 65536) return finish(11);
        sp--;
        for (let i = 0; i < tlen; i++) out[olen++] = text.charCodeAt(i);
        break;
      }
      case 0x51: {
        if (olen + 1 > 65536) return finish(11);
        out[olen++] = stk[--sp] & 255;
        break;
      }
      case 0x52:
        stk[sp++] = ipos < ilen ? inp[ipos++] : -1;
        break;
      case 0x53:
        return finish(stk[--sp] & 255);
    }
  }
}

const inDir = process.env.MAKEFUN_INPUT_DIR || '/input';
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const entries = fs.readdirSync(inDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
for (const id of entries) {
  const prog = fs.readFileSync(inDir + '/' + id + '/program.bin');
  const inp = fs.readFileSync(inDir + '/' + id + '/input.bin');
  const res = executeProgram(prog, inp);
  const dst = outDir + '/' + id;
  fs.mkdirSync(dst, { recursive: true });
  fs.writeFileSync(dst + '/stdout.bin', res.stdout);
  fs.writeFileSync(dst + '/exit.txt', String(res.exit));
}
