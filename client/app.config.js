// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: Android 번들 및 네이티브 모듈의 한글 경로 통일
const { withAppBuildGradle, withSettingsGradle } = require('expo/config-plugins');

module.exports = ({ config }) => {
  config = withSettingsGradle(config, (androidConfig) => {
    const marker = "// Normalize macOS project paths for AGP prefab mappings.";
    if (!androidConfig.modResults.contents.includes(marker)) {
      androidConfig.modResults.contents += `
${marker}
if (System.getProperty("os.name").toLowerCase().contains("mac")) {
    rootProject.children.each { descriptor ->
        descriptor.projectDir = new File(java.text.Normalizer.normalize(
            descriptor.projectDir.absolutePath, java.text.Normalizer.Form.NFC))
    }
}
`;
    }
    return androidConfig;
  });
  return withAppBuildGradle(config, (androidConfig) => {
    const original = "require('expo/scripts/resolveAppEntry')";
    const canonical = "process.argv[1] = require('fs').realpathSync.native(process.argv[1]); "
      + original;
    const contents = androidConfig.modResults.contents;

    // macOS Java paths can be NFC while Node's cwd uses decomposed Unicode.
    // Resolve through the filesystem before Expo derives the absolute entry path.
    if (!contents.includes(canonical)) {
      if (!contents.includes(original)) {
        throw new Error('Expo Android entry resolver was not found in app/build.gradle');
      }
      androidConfig.modResults.contents = contents.replace(original, canonical);
    }
    return androidConfig;
  });
};
