// webpack.config.js

const path = require('path');

module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // Adjust this if your src folder is elsewhere
    },
  },
};
