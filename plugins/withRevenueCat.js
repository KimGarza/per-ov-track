const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

module.exports = function withRevenueCat(config) {
  return withAndroidManifest(config, config => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    // Let bank/payment verification return to an in-flight Play purchase.
    activity.$['android:launchMode'] = 'singleTop';
    return config;
  });
};
