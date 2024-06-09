const path = require('path');

module.exports = {
    resolve: {
    extensions: ['.js'], // Add this line
    fallback: {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib")
    }
  }
};