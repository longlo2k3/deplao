/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest', // Sử dụng preset của ts-jest
  testEnvironment: 'node', // Môi trường chạy test là Node.js
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      isolatedModules: true, // Tăng tốc, không type-check toàn bộ (tránh OOM)
    }], // Biến đổi tệp TypeScript và TSX bằng ts-jest
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/ui/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'], // Đường dẫn đến các tệp test
};
