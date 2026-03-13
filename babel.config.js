module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@store': './src/store',
            '@types': './src/types',
            '@contexts': './src/contexts',
            '@utils': './src/utils',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
