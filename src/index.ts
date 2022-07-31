#!/usr/bin/env node
import type { PackageJson } from "type-fest";
import path from "path";
import fs from "fs-extra";
import { runCli } from "~/cli/index.js";
import { createProject } from "~/helpers/createProject.js";
import { initializeGit } from "~/helpers/initGit.js";
import { logNextSteps } from "~/helpers/logNextSteps.js";
import { buildPkgInstallerMap } from "~/installers/index.js";
import { logger } from "~/utils/logger.js";
import { parseNameAndPath } from "~/utils/parseNameAndPath.js";
import { renderTitle } from "~/utils/renderTitle.js";
import { installDependencies } from "./helpers/installDependencies.js";

const main = async () => {
  renderTitle();

  const {
    appName,
    packages,
    flags: { noGit, noInstall },
  } = await runCli();

  const usePackages = buildPkgInstallerMap(packages);

  // e.g. dir/@mono/app returns ["@mono/app", "dir/app"]
  const [scopedAppName, appDir] = parseNameAndPath(appName);

  const projectDir = await createProject({
    projectName: appDir,
    packages: usePackages,
    noInstall,
  });

  if (!noInstall) {
    installDependencies(projectDir);
  }

  if (!noGit) {
    initializeGit(projectDir);
  }

  logNextSteps({ projectName: appDir, packages: usePackages, noInstall });

  // Write name to package.json
  const pkgJson = fs.readJSONSync(
    path.join(projectDir, "package.json"),
  ) as PackageJson;
  pkgJson.name = scopedAppName;
  fs.writeJSONSync(path.join(projectDir, "package.json"), pkgJson, {
    spaces: 2,
  });

  process.exit(0);
};

main().catch((err) => {
  logger.error("Aborting installation...");
  if (err instanceof Error) {
    logger.error(err);
  } else {
    logger.error(
      "An unknown error has occurred. Please open an issue on github with the below:",
    );
    console.log(err);
  }
  process.exit(1);
});
