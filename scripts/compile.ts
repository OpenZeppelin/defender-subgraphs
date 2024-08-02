import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { GENERATED_DIR, CONFIG_FILE_NAME } from '../config';

const compile = (network: string): Promise<void> =>
  new Promise((resolve) => {
    const configPath = join(GENERATED_DIR, network, CONFIG_FILE_NAME);
    const includePath = join(__dirname, '../node_modules/@openzeppelin/subgraphs/src/datasources');

    const ls = spawn('npx', [
      'graph-compiler',
      '--config',
      `${configPath}`,
      '--include',
      `${includePath}`,
      '--root',
      join(__dirname, '../'),
      '--export-schema',
      '--export-subgraph',
    ]);
    ls.stdout.on('data', (data) => console.log(data.toString()));
    ls.stderr.on('data', (data) => console.error(data.toString()));
    ls.on('close', resolve);
  });

const run = async (network?: string): Promise<void> => {
  if (!existsSync(GENERATED_DIR)) {
    console.error(`Path ${GENERATED_DIR} doesn't exist.`, 'Did you forget to run yarn generate:configs?');
    process.exit(1);
  }
  if (!network) throw new Error('Network not provided');

  await compile(network);
};

run(process.argv[2]);
