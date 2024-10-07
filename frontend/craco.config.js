// craco.config.js
module.exports = {
    webpack: {
      configure: {
        resolve: {
          fallback: {
            http: false, // Disables the polyfill for 'http'
          },
        },
      },
    },
};
  