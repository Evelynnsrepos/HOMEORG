/**
 * Builds the release APK.
 *
 *   node scripts/build-apk.js          (npm run apk does this last)
 *   TIDYWELL_ABIS=armeabi-v7a,arm64-v8a node scripts/build-apk.js
 *
 * Gradle needs two things this machine does not put on the PATH: a JDK 21 (the
 * java on PATH is newer, and the Android plugin will not have it) and the
 * Android SDK. Both are looked up here and handed to the build, so the command
 * works from any shell — cmd, PowerShell and bash all disagree about how to
 * spell ./gradlew, and none of them carry the same environment.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const APK = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const firstThatExists = (...paths) => paths.find((p) => p && fs.existsSync(p));

const javaHome = firstThatExists(process.env.JAVA_HOME, 'C:\\Program Files\\Java\\jdk-21');
const sdk = firstThatExists(
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  process.env.HOME && path.join(process.env.HOME, 'Android', 'Sdk'),
);

if (!fs.existsSync(ANDROID)) {
  console.error('No android/ yet. Run: npx expo prebuild -p android');
  process.exit(1);
}
if (!javaHome) {
  console.error('No JDK 21 found. Install it, or point JAVA_HOME at one.');
  process.exit(1);
}
if (!sdk) {
  console.error('No Android SDK found. Install it, or point ANDROID_HOME at one.');
  process.exit(1);
}

// prebuild wipes android/, so this has to go back every time. Forward slashes:
// a Java properties file reads a backslash as an escape character.
fs.writeFileSync(path.join(ANDROID, 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '/')}\n`);

console.log(`JDK ${javaHome}\nSDK ${sdk}\n`);

const wrapper = path.join(ANDROID, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const abis = process.env.TIDYWELL_ABIS || 'arm64-v8a';
if (!/^[a-z0-9,-]+$/.test(abis)) {
  console.error(`TIDYWELL_ABIS looks wrong: ${abis}`);
  process.exit(1);
}

// one string, not a command plus an argument array: the wrapper is a .bat, so
// this runs through a shell either way, and node deprecates the split form
const gradle = spawnSync(`"${wrapper}" assembleRelease -PreactNativeArchitectures=${abis}`, {
  cwd: ANDROID,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk },
});

if (gradle.status !== 0) process.exit(gradle.status ?? 1);

// Gradle can report success for a build that produced nothing useful, so look.
if (!fs.existsSync(APK)) {
  console.error(`\nGradle finished, but there is no APK at ${APK}`);
  process.exit(1);
}

console.log(`\n${APK}\n${(fs.statSync(APK).size / 1024 / 1024).toFixed(0)} MB, ${abis}`);
