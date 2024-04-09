import { join } from 'path';
import { config } from 'dotenv';

config();

const GENERATED_DIR = join(__dirname, '../networks');
const CONFIG_FILE_NAME = 'config.json';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const STUDIO_ACCESS_TOKEN = process.env.STUDIO_ACCESS_TOKEN;

export { GENERATED_DIR, CONFIG_FILE_NAME, ACCESS_TOKEN, STUDIO_ACCESS_TOKEN };
