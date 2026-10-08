// Copia os instaladores gerados em app/release para a pasta instaladores/ na raiz do projeto.
const fs = require('fs');
const path = require('path');

const release = path.join(__dirname, '..', 'release');
const dest = path.join(__dirname, '..', '..', 'instaladores');
const targets = [
  { match: /\.dmg$/, folder: 'mac' },
  { match: /\.exe$/, folder: 'windows' },
];

for (const file of fs.readdirSync(release)) {
  const target = targets.find(t => t.match.test(file) && !file.includes('__uninstaller'));
  if (!target) continue;
  fs.mkdirSync(path.join(dest, target.folder), { recursive: true });
  fs.copyFileSync(path.join(release, file), path.join(dest, target.folder, file));
  console.log(`instaladores/${target.folder}/${file}`);
}
