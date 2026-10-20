/**
 * Points the Android release build at your own signing key.
 *
 * `npx expo prebuild` regenerates android/ from scratch and its release build
 * is signed with the throwaway debug key, which changes every time — an app
 * signed with a new key won't install over the old one. So: run this after
 * every prebuild.
 *
 *   node scripts/sign-android.js
 *
 * The key itself lives in credentials/ (outside android/, so prebuild can't
 * delete it) and is gitignored. Keep it. Lose it and you can't update an
 * already-installed copy of the app — only uninstall and start over.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const PROPS = path.join(ROOT, 'credentials', 'keystore.properties');

if (!fs.existsSync(GRADLE)) {
  console.error('No android/ yet. Run: npx expo prebuild -p android');
  process.exit(1);
}
if (!fs.existsSync(PROPS)) {
  console.error(`No signing key at ${PROPS}. See the README for how to make one.`);
  process.exit(1);
}

let gradle = fs.readFileSync(GRADLE, 'utf8');

if (gradle.includes('tidywellRelease')) {
  console.log('Already wired up.');
  process.exit(0);
}

const config = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        tidywellRelease {
            def props = new Properties()
            // read as UTF-8 and drop any byte order mark, or the first key
            // comes back with an invisible character glued to its name
            def text = file("../../credentials/keystore.properties").getText("UTF-8")
            props.load(new StringReader(text.replace("\\uFEFF", "")))
            storeFile file(props['TIDYWELL_STORE_FILE'])
            storePassword props['TIDYWELL_STORE_PASSWORD']
            keyAlias props['TIDYWELL_KEY_ALIAS']
            keyPassword props['TIDYWELL_KEY_PASSWORD']
        }
    }`;

const before = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

if (!gradle.includes(before)) {
  console.error('build.gradle does not look the way this script expects — patch it by hand.');
  process.exit(1);
}

gradle = gradle.replace(before, config);

// the release build type is the second `signingConfig signingConfigs.debug`
const parts = gradle.split('signingConfig signingConfigs.debug');
if (parts.length !== 3) {
  console.error(`Expected two debug signing references, found ${parts.length - 1}.`);
  process.exit(1);
}
gradle =
  parts[0] +
  'signingConfig signingConfigs.debug' +
  parts[1] +
  'signingConfig signingConfigs.tidywellRelease' +
  parts[2];

fs.writeFileSync(GRADLE, gradle);
console.log('Release builds now use credentials/tidywell.keystore.');
