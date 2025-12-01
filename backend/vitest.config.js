module.exports = {
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js', 'controllers/**/__test__/**/*.test.js', 'controllers/**/__test__/*.test.js']
  }
};
