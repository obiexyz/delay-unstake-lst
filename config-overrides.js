const path = require('path');
const rewireAlias = require('react-app-rewire-alias');

module.exports = function override(config, env) {
  // Add the aliases
  config.resolve.fallback = {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "url": require.resolve("url/"),
  };

  return config;
};