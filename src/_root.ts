import { dirname } from 'path';

// Reliable definition of root directory that should be used for all absolute paths,
// this is especially important during minification step
export const ROOT_DIR = __dirname.replace(/\\/g, '/');

// Project directory definition
export const PROJECT_DIR = dirname(ROOT_DIR);
