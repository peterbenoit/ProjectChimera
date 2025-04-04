const fs = require('fs');
const path = require('path');

// Path to the build info file
const buildInfoPath = path.resolve(__dirname, '../buildInfo.json');
const manifestPath = path.resolve(__dirname, '../src/manifest.json');

// Read the current build info
const buildInfo = require(buildInfoPath);
const manifest = require(manifestPath);

// Increment the build number
buildInfo.buildNumber += 1;

// Update version in manifest with build number
// This preserves the semver format but adds build number
const versionBase = manifest.version.split('.').slice(0, 3).join('.');
manifest.version = `${versionBase}.${buildInfo.buildNumber}`;

// Write the updated build info back to the file
fs.writeFileSync(
	buildInfoPath,
	JSON.stringify(buildInfo, null, 2),
	'utf8'
);

// Write the updated manifest back to the file
fs.writeFileSync(
	manifestPath,
	JSON.stringify(manifest, null, 2),
	'utf8'
);

console.log(`Build number incremented to ${buildInfo.buildNumber}`);
console.log(`Version updated to ${manifest.version}`);

// Return the build number so it can be used by webpack
module.exports = buildInfo.buildNumber;
