import crypto from 'crypto';

// 토큰 생성
export const generateToken = (): Token => {
  // 32바이트(64자) 랜덤 HEX 문자열 생성
  return crypto.randomBytes(32).toString('hex');
};

// 토큰 검증
export const verifyToken = (token: Token): boolean => {
  return token.length === 64;
};

// 토큰 타입
export type Token = string;
