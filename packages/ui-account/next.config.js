module.exports = {
  publicRuntimeConfig: {
    url: process.env.URL,
    facebookClientId: process.env.FACEBOOK_CLIENT_ID,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    twitterClientId: process.env.TWITTER_CLIENT_ID,
  },
  serverRuntimeConfig: {
    url: process.env.SERVER_SIDE_URL || process.env.URL,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty'
      };
    }
    return config;
  }
};
