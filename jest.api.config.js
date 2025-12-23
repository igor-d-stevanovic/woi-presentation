module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/api.test.js'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    testTimeout: 10000,
    reporters: [
        'default',
        ['jest-html-reporters', {
            publicPath: './test-reports',
            filename: 'api-tests.html',
            expand: true,
            pageTitle: 'API Test Report'
        }]
    ]
};
