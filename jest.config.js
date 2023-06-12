module.exports = {
    bail: true,
    testTimeout: 55555,
    preset: '@shelf/jest-mongodb',
    coverageDirectory: 'test-reports',
    watchPathIgnorePatterns: ['globalConfig'],
    reporters: ['default', ['jest-junit', { outputDirectory: 'test-reports' }]],
};