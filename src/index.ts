#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

async function updateVersions() {
  console.log('finding all package.json files...');
  const currentPkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')) as any;
  const workspaces = currentPkg.workspaces?.packages ?? currentPkg.workspaces;
  if (!workspaces) {
    console.log('No workspaces found.');
    return;
  }
  const workspacePkgFiles: string[] = workspaces
    .map((workspace: string) => {
      const workspaceDir = workspace.replace('/*', '');
      return fs
        .readdirSync(workspaceDir)
        .map((dir) => path.join(workspaceDir, dir, 'package.json'))
        .filter((file) => fs.existsSync(file));
    })
    .flat();
  const workspacePkgs: { name: string; version: string }[] = workspacePkgFiles.map(
    (file) => JSON.parse(fs.readFileSync(file, 'utf-8')) as { name: string; version: string },
  );
  workspacePkgs.forEach((pkg) => {
    console.log(`Package: ${pkg.name}, Version ${pkg.version}`);
  });
  workspacePkgFiles.forEach((file) => {
    // console.log(`ok dealing with ${file}`);
    const fileContent = fs.readFileSync(file, 'utf-8');
    let newFileContent = fs.readFileSync(file, 'utf-8');
    workspacePkgs.forEach((pkg) => {
      if (pkg.name && pkg.version) {
        newFileContent = newFileContent.replace(
          new RegExp(`"${pkg.name}": "\\^[0-9]+\\.[0-9]+\\.[0-9]+"`, 'g'),
          `"${pkg.name}": "^${pkg.version}"`,
        );
      }
    });
    if (fileContent !== newFileContent) {
      console.log(`Updating: ${file}`);
      fs.writeFileSync(file, newFileContent);
    }
  });
}

updateVersions().then(() => {
  console.log('Done!');
});
