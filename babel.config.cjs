// babel.config.cjs
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // FIXED: Reanimated v4 requires the worklets plugin, not the reanimated one
      'react-native-worklets/plugin',
    ],
  };
};
