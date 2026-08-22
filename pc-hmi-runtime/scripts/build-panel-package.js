#!/usr/bin/env node
/** Build a panel deploy package for a project — used by npm run build:panel */
const path = require('path');
const { ProjectService } = require('../server/services/project-service');
const { DeployService } = require('../server/services/deploy-service');

const ROOT = path.join(__dirname, '..');
const projectId = process.argv[2] || process.env.PROJECT_ID;

function main() {
  if (!projectId) {
    console.error('Usage: npm run build:panel -- <projectId>');
    console.error('   or: PROJECT_ID=myplant node scripts/build-panel-package.js');
    process.exit(1);
  }

  const projectService = new ProjectService(ROOT);
  const deployService = new DeployService(ROOT);

  if (!projectService.projectExists(projectId)) {
    console.error(`Project not found: ${projectId}`);
    process.exit(1);
  }

  const result = deployService.buildPanelPackage(projectId, projectService);
  console.log(`Panel package built for "${projectId}"`);
  console.log(`  Folder: ${result.packageDir}`);
  if (result.zipPath) {
    console.log(`  ZIP:    ${result.zipPath}`);
  } else if (result.zipError) {
    console.warn(`  ZIP:    failed (${result.zipError})`);
  }
}

main();
