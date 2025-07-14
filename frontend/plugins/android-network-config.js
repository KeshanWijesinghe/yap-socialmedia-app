const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withCustomAndroid(config) {
  return withAndroidManifest(config, async (config) => {
    let androidManifest = config.modResults;

    // Add network security config for HTTP requests (for development)
    androidManifest.manifest.application[0].$["android:usesCleartextTraffic"] =
      "true";
    androidManifest.manifest.application[0].$["android:networkSecurityConfig"] =
      "@xml/network_security_config";

    return config;
  });
};
