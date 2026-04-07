import { EXP_PER_CHECKIN } from "@/config/defaults";

/**
 * คำนวณ EXP ที่ต้องการสำหรับแต่ละเลเวล (scaling)
 * Level 1-10:  50 EXP per level
 * Level 11-20: 60 EXP per level
 * Level 21-30: 70 EXP per level
 * ...ไล่ระดับไปเรื่อยๆ ทุก 10 เลเวล เพิ่ม 10 EXP
 */
export function getExpRequiredForLevel(level: number): number {
  const bracket = Math.floor((level - 1) / 10);
  return 50 + bracket * 10;
}

/**
 * คำนวณ EXP สะสมทั้งหมดที่ต้องการเพื่อถึงเลเวลที่กำหนด (ตั้งแต่เลเวล 1)
 */
function getTotalExpForLevel(targetLevel: number): number {
  let total = 0;
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    total += getExpRequiredForLevel(lvl);
  }
  return total;
}

/**
 * คำนวณเลเวล, EXP ปัจจุบัน, และ EXP สูงสุดของเลเวลนั้น จากจำนวนเช็คอิน
 */
export function calculateLevelAndExp(checkinCount: number): {
  level: number;
  exp: number;
  maxExp: number;
} {
  const totalExp = checkinCount * EXP_PER_CHECKIN;
  let level = 1;
  let expUsed = 0;

  while (true) {
    const needed = getExpRequiredForLevel(level);
    if (expUsed + needed > totalExp) {
      return {
        level,
        exp: totalExp - expUsed,
        maxExp: needed,
      };
    }
    expUsed += needed;
    level++;
  }
}

/**
 * คำนวณเลเวลจากจำนวนเช็คอิน (ใช้ในหน้า Index)
 */
export function calculateLevel(checkinCount: number): number {
  return calculateLevelAndExp(checkinCount).level;
}
