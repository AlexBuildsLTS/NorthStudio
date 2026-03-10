const { getDefaultConfig } = require('expo/metro-config');
// FIXED: Lowercase 'w' in withNativewind for v5 compatibility
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('mjs', 'cjs');

// FIXED: Lowercase 'w'
module.exports = withNativewind(config);
