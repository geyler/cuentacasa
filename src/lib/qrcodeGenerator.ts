/**
 * Lightweight, 100% Offline Client-Side QR Code SVG Generator for Samy Store PWA
 * Generates inline SVG markup and Data URLs without any external network calls or APIs.
 */

// Basic QR Code Matrix Generator (Version 1-15, Byte Mode, Error Correction L/M)
// Optimized for offline PWA serialization.

class QRCodeModel {
  typeNumber: number;
  errorCorrectLevel: number;
  modules: (boolean | null)[][] = [];
  moduleCount: number = 0;
  dataCache: number[] | null = null;
  dataList: { mode: number; data: string }[] = [];

  constructor(typeNumber: number, errorCorrectLevel: number) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
  }

  addData(data: string) {
    this.dataList.push({ mode: 4, data }); // Mode 4 = Byte mode
    this.dataCache = null;
  }

  isDark(row: number, col: number): boolean {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(`${row},${col}`);
    }
    return !!this.modules[row][col];
  }

  getModuleCount(): number {
    return this.moduleCount;
  }

  make() {
    if (this.typeNumber < 1) {
      let typeNumber = 1;
      for (typeNumber = 1; typeNumber <= 40; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
        const buffer = new QRBitBuffer();
        for (let i = 0; i < this.dataList.length; i++) {
          const item = this.dataList[i];
          buffer.put(item.mode, 4);
          buffer.put(item.data.length, QRUtil.getLengthInBits(item.mode, typeNumber));
          buffer.putBytes(item.data);
        }
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount;
        }
        if (buffer.getLengthInBits() <= totalDataCount * 8) break;
      }
      this.typeNumber = typeNumber;
    }
    this.makeImpl(false, this.getBestMaskPattern());
  }

  private makeImpl(test: boolean, maskPattern: number) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }
    if (this.dataCache === null) {
      this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  }

  private setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  private getBestMaskPattern(): number {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(this);
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  private setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = c % 2 === 0;
    }
  }

  private setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  private setupTypeNumber(test: boolean) {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules[Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
      this.modules[(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }

  private setupTypeInfo(test: boolean, maskPattern: number) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }
      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod;
      } else {
        this.modules[8][15 - i - 1] = mod;
      }
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  private mapData(data: number[], maskPattern: number) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  private static createData(typeNumber: number, errorCorrectLevel: number, dataList: { mode: number; data: string }[]): number[] {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      buffer.put(item.mode, 4);
      buffer.put(item.data.length, QRUtil.getLengthInBits(item.mode, typeNumber));
      buffer.putBytes(item.data);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error(`Data overflow: ${buffer.getLengthInBits()} > ${totalDataCount * 8}`);
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return QRCodeModel.createBytes(buffer, rsBlocks);
  }

  private static createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]): number[] {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);
    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }
    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }
    const data = new Array(totalCodeCount);
    let index = 0;
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }
    return data;
  }
}

// Polynomial and Galois Field Helper
class QRPolynomial {
  num: number[];
  constructor(num: number[], shift: number) {
    if (num.length === 0) throw new Error('Polynomial len error');
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
  }
  get(index: number): number {
    return this.num[index];
  }
  getLength(): number {
    return this.num.length;
  }
  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  }
  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(e);
  }
}

class QRRSBlock {
  totalCount: number;
  dataCount: number;
  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  static getRSBlocks(typeNumber: number, errorCorrectLevel: number): QRRSBlock[] {
    const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
    if (rsBlock === undefined) throw new Error(`Bad rs block: ${typeNumber}/${errorCorrectLevel}`);
    const length = rsBlock.length / 3;
    const list: QRRSBlock[] = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }
    return list;
  }
  private static getRsBlockTable(typeNumber: number, errorCorrectLevel: number): number[] | undefined {
    const RS_BLOCK_TABLE = [
      // 1
      [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
      // 2
      [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
      // 3
      [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
      // 4
      [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
      // 5
      [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
      // 6
      [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
      // 7
      [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
      // 8
      [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
      // 9
      [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
      // 10
      [2, 192, 152], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
      // 11
      [4, 140, 110], [1, 80, 50, 4, 81, 51], [4, 44, 22, 4, 45, 23], [3, 36, 12, 8, 37, 13],
      // 12
      [2, 168, 134, 2, 169, 135], [6, 56, 36, 2, 57, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
      // 13
      [4, 180, 144], [8, 53, 30, 1, 54, 31], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
      // 14
      [3, 197, 153, 1, 198, 154], [4, 116, 75, 5, 117, 76], [4, 65, 26, 5, 66, 27], [11, 36, 12, 5, 37, 13],
      // 15
      [5, 193, 151, 1, 194, 152], [5, 116, 74, 5, 117, 75], [7, 54, 24, 3, 55, 25], [14, 36, 12, 3, 37, 13],
      // 16
      [5, 192, 150, 1, 193, 151], [7, 87, 54, 3, 88, 55], [10, 47, 20, 2, 48, 21], [14, 37, 12, 4, 38, 13],
      // 17
      [1, 192, 150, 5, 193, 151], [10, 80, 48, 1, 81, 49], [9, 48, 20, 4, 49, 21], [14, 40, 12, 6, 41, 13],
      // 18
      [5, 192, 150, 3, 193, 151], [9, 93, 58, 4, 94, 59], [11, 50, 21, 4, 51, 22], [14, 36, 12, 8, 37, 13],
      // 19
      [3, 192, 150, 7, 193, 151], [3, 107, 66, 11, 108, 67], [11, 54, 22, 6, 55, 23], [12, 42, 13, 10, 43, 14],
      // 20
      [3, 192, 150, 9, 193, 151], [3, 115, 70, 13, 116, 71], [15, 48, 19, 5, 49, 20], [14, 42, 13, 10, 43, 14],
      // 21
      [17, 140, 110], [17, 84, 50], [19, 46, 18, 6, 47, 19], [17, 42, 12, 11, 43, 13],
      // 22
      [17, 140, 110, 2, 141, 111], [7, 116, 70, 14, 117, 71], [16, 47, 18, 10, 48, 19], [14, 46, 13, 16, 47, 14],
      // 23
      [4, 140, 110, 16, 141, 111], [11, 116, 70, 12, 117, 71], [18, 49, 19, 10, 50, 20], [12, 47, 13, 20, 48, 14],
      // 24
      [6, 140, 110, 16, 141, 111], [11, 124, 74, 14, 125, 75], [22, 45, 17, 8, 46, 18], [6, 48, 13, 28, 49, 14],
      // 25
      [8, 140, 110, 16, 141, 111], [7, 140, 84, 20, 141, 85], [22, 50, 19, 10, 51, 20], [18, 45, 12, 18, 46, 13],
      // 26
      [10, 140, 110, 16, 141, 111], [28, 86, 50, 4, 87, 51], [3, 51, 19, 31, 52, 20], [22, 45, 12, 16, 46, 13],
      // 27
      [12, 140, 110, 16, 141, 111], [8, 140, 84, 24, 141, 85], [12, 52, 20, 24, 53, 21], [2, 45, 12, 38, 46, 13],
      // 28
      [14, 140, 110, 16, 141, 111], [3, 140, 84, 31, 141, 85], [13, 54, 21, 25, 55, 22], [26, 45, 12, 16, 46, 13],
      // 29
      [16, 140, 110, 16, 141, 111], [21, 116, 70, 17, 117, 71], [17, 54, 21, 23, 55, 22], [36, 45, 12, 8, 46, 13],
      // 30
      [18, 140, 110, 16, 141, 111], [19, 134, 80, 21, 135, 81], [22, 54, 21, 20, 55, 22], [20, 45, 12, 26, 46, 13],
      // 31
      [20, 140, 110, 16, 141, 111], [32, 104, 62, 12, 105, 63], [2, 54, 20, 42, 55, 21], [24, 45, 12, 24, 46, 13],
      // 32
      [22, 140, 110, 16, 141, 111], [12, 140, 84, 34, 141, 85], [10, 54, 20, 36, 55, 21], [28, 45, 12, 22, 46, 13],
      // 33
      [24, 140, 110, 16, 141, 111], [35, 116, 70, 14, 117, 71], [14, 54, 20, 34, 55, 21], [14, 45, 12, 38, 46, 13],
      // 34
      [26, 140, 110, 16, 141, 111], [17, 140, 84, 34, 141, 85], [14, 54, 20, 36, 55, 21], [14, 45, 12, 40, 46, 13],
      // 35
      [28, 140, 110, 16, 141, 111], [17, 140, 84, 35, 141, 85], [19, 54, 20, 33, 55, 21], [12, 45, 12, 44, 46, 13],
      // 36
      [30, 140, 110, 16, 141, 111], [17, 140, 84, 37, 141, 85], [22, 54, 20, 32, 55, 21], [16, 45, 12, 42, 46, 13],
      // 37
      [32, 140, 110, 16, 141, 111], [17, 140, 84, 39, 141, 85], [25, 54, 20, 31, 55, 21], [20, 45, 12, 40, 46, 13],
      // 38
      [34, 140, 110, 16, 141, 111], [17, 140, 84, 41, 141, 85], [27, 54, 20, 31, 55, 21], [23, 45, 12, 39, 46, 13],
      // 39
      [36, 140, 110, 16, 141, 111], [17, 140, 84, 43, 141, 85], [31, 54, 20, 29, 55, 21], [23, 45, 12, 41, 46, 13],
      // 40
      [38, 140, 110, 16, 141, 111], [17, 140, 84, 45, 141, 85], [35, 54, 20, 27, 55, 21], [24, 45, 12, 42, 46, 13]
    ];
    return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + errorCorrectLevel];
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  length: number = 0;
  get(index: number): boolean {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }
  put(num: number, length: number) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
  putBytes(str: string) {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128) {
        this.put(code, 8);
      } else {
        const utf8 = encodeURIComponent(str.charAt(i)).slice(1).split('%');
        for (let j = 0; j < utf8.length; j++) {
          this.put(parseInt(utf8[j], 16), 8);
        }
      }
    }
  }
  getLengthInBits(): number { return this.length; }
}

const QRMath = {
  glog: (n: number) => {
    if (n < 1) throw new Error(`glog(${n})`);
    return LOG_TABLE[n];
  },
  gexp: (n: number) => {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return EXP_TABLE[n];
  }
};
const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);
for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

const QRUtil = {
  getBCHTypeInfo: (data: number) => {
    let d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(1335) >= 0) {
      d ^= 1335 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(1335));
    }
    return ((data << 10) | d) ^ 21522;
  },
  getBCHTypeNumber: (data: number) => {
    let d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(7973) >= 0) {
      d ^= 7973 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(7973));
    }
    return (data << 12) | d;
  },
  getBCHDigit: (data: number) => {
    let digit = 0;
    while (data !== 0) { digit++; data >>>= 1; }
    return digit;
  },
  getPatternPosition: (typeNumber: number) => {
    const PATTERN_POSITION_TABLE = [
      [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
      [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 28, 48, 68],
      [6, 30, 50, 70], [6, 30, 54, 78], [6, 30, 58, 86], [6, 34, 62, 90],
      [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170], [6, 34, 62, 90, 118, 146, 174]
    ];
    return PATTERN_POSITION_TABLE[typeNumber - 1] || [];
  },
  getMask: (maskPattern: number, i: number, j: number) => {
    switch (maskPattern) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
      default: throw new Error(`bad maskPattern:${maskPattern}`);
    }
  },
  getErrorCorrectPolynomial: (errorCorrectLength: number) => {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  },
  getLengthInBits: (mode: number, type: number) => {
    if (1 <= type && type < 10) return 8;
    return 16;
  },
  getLostPoint: (qrCode: QRCodeModel) => {
    const moduleCount = qrCode.getModuleCount();
    let lostPoint = 0;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        let sameCount = 0;
        const dark = qrCode.isDark(row, col);
        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) continue;
          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) continue;
            if (r === 0 && c === 0) continue;
            if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += 3 + sameCount - 5;
      }
    }
    return lostPoint;
  }
};

/**
 * Generate inline SVG markup string for QR code (100% offline).
 */
export function generateQRCodeSVG(text: string, size: number = 260): string {
  const tryGenerate = (strToEncode: string): string => {
    const qr = new QRCodeModel(0, 1); // Auto-detect type, Error correction L (1)
    qr.addData(strToEncode);
    qr.make();

    const count = qr.getModuleCount();
    const cellWidth = size / count;
    let path = '';

    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) {
          const x = col * cellWidth;
          const y = row * cellWidth;
          path += `M${x.toFixed(2)},${y.toFixed(2)}h${cellWidth.toFixed(2)}v${cellWidth.toFixed(2)}h-${cellWidth.toFixed(2)}z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#FFFFFF"/>
      <path d="${path}" fill="#000000"/>
    </svg>`;
  };

  try {
    return tryGenerate(text);
  } catch (e) {
    // Attempt progressive payload pruning if data exceeds QR capacity
    try {
      let parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        const productLimits = [15, 10, 6, 3, 1];
        for (const limit of productLimits) {
          try {
            const pruned = { ...parsed };
            if (Array.isArray(pruned.p)) pruned.p = pruned.p.slice(0, limit);
            if (Array.isArray(pruned.s)) pruned.s = pruned.s.slice(0, Math.min(limit, 5));
            if (Array.isArray(pruned.h)) pruned.h = pruned.h.slice(0, 3);
            if (Array.isArray(pruned.items)) pruned.items = pruned.items.slice(0, limit);
            return tryGenerate(JSON.stringify(pruned));
          } catch {
            // Continue trying with smaller limits
          }
        }
      }
    } catch {
      // Ignore
    }

    console.error('Offline QR SVG error:', e);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#FEE2E2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#DC2626" font-size="12" font-weight="bold">Error QR</text>
    </svg>`;
  }
}

/**
 * Generate Data URL string for image tags <img src="..." /> (100% offline).
 */
export function generateQRCodeDataURL(text: string, size: number = 260): string {
  const svg = generateQRCodeSVG(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
