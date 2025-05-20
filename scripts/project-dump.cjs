const fs = require('fs');
const path = require('path');
let ignore;

try {
	ignore = require('ignore');
} catch (e) {
	console.log('Module "ignore" not found. Installing...');
	require('child_process').execSync('npm install ignore', { stdio: 'inherit' });
	ignore = require('ignore');
}

// Load .gitignore rules
const gitignorePath = path.join(__dirname, '.gitignore');
const ig = ignore();
if (fs.existsSync(gitignorePath)) {
	const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
	ig.add(gitignoreContent);
}

ig.add('.git'); // Ignore the .git directory itself
ig.add('*.ico'); // Ignore .icon files
ig.add('*.png'); // Ignore .png files
ig.add('*.jpg'); // Ignore .jpg files
ig.add('*.jpeg'); // Ignore .jpeg files
ig.add('*.gif'); // Ignore .gif files
ig.add('*.svg'); // Ignore .svg files
ig.add('*.webp'); // Ignore .webp files
ig.add('*.avif'); // Ignore .avif files
ig.add('*.webp'); // Ignore .webp files
ig.add('.DS_Store'); // Ignore .DS_Store files
ig.add('project-structure.json'); // Ignore the output file itself
ig.add('project-dump.js'); // Ignore this script itself
ig.add('docs'); // Ignore the docs directory
ig.add('README.md'); // Ignore the README file
ig.add('LICENSE'); // Ignore the LICENSE file
ig.add('package-lock.json'); // Ignore the package-lock.json file
ig.add('node_modules'); // Ignore the node_modules directory
ig.add('.next'); // Ignore the .next directory
ig.add('.vercel'); // Ignore the .vercel directory
ig.add('fonts'); // Ignore fonts directory
ig.add('webfonts'); // Ignore webfonts directory
ig.add('*.ttf'); // Ignore .ttf files
ig.add('*.woff'); // Ignore .woff files
ig.add('*.woff2'); // Ignore .woff2 files
ig.add('*.otf'); // Ignore .otf files
ig.add('*.eot'); // Ignore .eot files
ig.add('coverage'); // Ignore coverage reports
ig.add('dist'); // Ignore build output directory
ig.add('build'); // Ignore alternative build output directory
ig.add('.turbo'); // Ignore TurboRepo cache
ig.add('.eslintcache'); // Ignore ESLint cache file
ig.add('.env'); // Ignore environment variable files
ig.add('.env.local');
ig.add('.env.development');
ig.add('.env.production');
ig.add('.vscode'); // Ignore VSCode project settings
ig.add('.idea'); // Ignore JetBrains IDE settings
ig.add('*.log'); // Ignore all .log files

// Function to recursively get directory structure and file contents
function getDirectoryStructure(dir, baseDir = dir) {
	const result = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(baseDir, fullPath);

		// Skip ignored files and directories
		if (ig.ignores(relativePath)) {
			continue;
		}

		if (entry.isDirectory()) {
			result.push({
				type: 'directory',
				name: entry.name,
				children: getDirectoryStructure(fullPath, baseDir),
			});
		} else if (entry.isFile()) {
			const content = fs.readFileSync(fullPath, 'utf8');
			result.push({
				type: 'file',
				name: entry.name,
				content,
			});
		}
	}

	return result;
}

// Main function to write the directory structure to a file
function writeDirectoryStructure() {
	const projectRoot = path.resolve(__dirname, '..');
	const structure = getDirectoryStructure(projectRoot);
	const outputFile = path.join(__dirname, 'project-structure.json');
	fs.writeFileSync(outputFile, JSON.stringify(structure), 'utf8');
	console.log(`Directory structure written to ${outputFile}`);
}

// Run the script
writeDirectoryStructure();
