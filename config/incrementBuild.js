const fs = require('fs');
const path = require('path');

// Path to all files we need to update
const buildInfoPath = path.resolve(__dirname, '../buildInfo.json');
const manifestPath = path.resolve(__dirname, '../src/manifest.json');
const packagePath = path.resolve(__dirname, '../package.json');

// Read the current files
const buildInfo = require(buildInfoPath);
const manifest = require(manifestPath);
const packageJson = require(packagePath);

// Increment the build number
buildInfo.buildNumber += 1;

// Update version in manifest with build number
// This preserves the semver format but adds build number
const versionBase = manifest.version.split('.').slice(0, 3).join('.');
const newVersion = `${versionBase}.${buildInfo.buildNumber}`;

// Update versions in both files
manifest.version = newVersion;
packageJson.version = newVersion;

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

// Write the updated package.json back to the file
fs.writeFileSync(
	packagePath,
	JSON.stringify(packageJson, null, 2),
	'utf8'
);

console.log(`Build number incremented to ${buildInfo.buildNumber}`);
console.log(`Version updated to ${newVersion} in both manifest.json and package.json`);

// Return the build number so it can be used by webpack
module.exports = buildInfo.buildNumber;
