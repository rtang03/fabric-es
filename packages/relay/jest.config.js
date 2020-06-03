module.exports = {
  roots: ['<rootDir>/src'],
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*(test))\\.[jt]s?$',
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/../../node_modules/'
  ],
  // testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules'],
  testURL: 'http://localhost/',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js']
};
