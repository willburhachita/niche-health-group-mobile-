const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports resolution so `convex/react` resolves correctly
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
