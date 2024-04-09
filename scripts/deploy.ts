import { spawn } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { GENERATED_DIR, CONFIG_FILE_NAME, ACCESS_TOKEN, STUDIO_ACCESS_TOKEN } from '../config';
import { copySync, moveSync } from 'fs-extra';
import pLimit from 'p-limit';
import { v4 as uuidv4 } from 'uuid';

const tmpPrefix = '.tmp.';

const deploy = (network: string): Promise<void> =>
  new Promise(async (resolve) => {
    const subgraphManifestPath = join(GENERATED_DIR, network, 'subgraph.yaml');
    if (!existsSync(subgraphManifestPath)) {
      console.error(`Path ${subgraphManifestPath} doesn't exist.`);
      process.exit(1);
    }
    const { product, name } = await import(join(GENERATED_DIR, network, CONFIG_FILE_NAME));
    const outputPath = join(GENERATED_DIR, network);

    const isStudio = product === 'subgraph-studio';
    const args = [
      'graph',
      'deploy',
      '--output-dir',
      outputPath,
      '--product',
      product,
      '--deploy-key',
      isStudio ? STUDIO_ACCESS_TOKEN : ACCESS_TOKEN,
      isStudio ? network : name,
      subgraphManifestPath,
    ];

    if (isStudio) {
      // creates a unique version label to avoid conflicts with existing subgraphs
      // this is only needed for subgraph-studio.
      args.push('--version-label', uuidv4());
    }

    const ls = spawn('npx', args);
    ls.stdout.on('data', (data) => console.log(data.toString()));
    ls.stderr.on('data', (data) => console.error(data.toString()));
    ls.on('close', resolve);
  });

// The graph's deploy script changes some paths that make the definition unusable after the first deployment
// This is just to keep its original content
const runRestoringOriginalContent = async (network: string, fn: () => Promise<void>): Promise<void> => {
  const networkDir = join(__dirname, '../networks', network);
  const tmpDir = join(__dirname, '../networks', `${tmpPrefix}${network}`);

  copySync(networkDir, tmpDir);
  await fn();
  moveSync(tmpDir, networkDir, { overwrite: true });
};

const run = async (): Promise<void> => {
  if (!existsSync(GENERATED_DIR)) {
    console.error(`Path ${GENERATED_DIR} doesn't exist.`);
    process.exit(1);
  }

  const limit = pLimit(1);

  const deploys = readdirSync(GENERATED_DIR)
    .map((network) => limit(() => runRestoringOriginalContent(network, () => deploy(network))));

  await Promise.all(deploys);
};

run();
