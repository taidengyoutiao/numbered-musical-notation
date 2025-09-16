import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const OPTIONAL_PLUGINS = [
  { name: 'postcss-import' },
  { name: 'postcss-url' },
  { name: 'autoprefixer' },
];

function resolvePlugin({ name, options = {} }) {
  try {
    let plugin = require(name);

    if (plugin && typeof plugin === 'object' && 'default' in plugin) {
      plugin = plugin.default;
    }

    if (typeof plugin === 'function') {
      return plugin(options);
    }

    return plugin ?? null;
  } catch (error) {
    if (isModuleNotFoundError(error, name)) {
      console.warn(`[postcss] Optional plugin "${name}" is not installed. Skipping.`);
      return null;
    }

    throw error;
  }
}

function isModuleNotFoundError(error, moduleName) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { code, message } = error;

  if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_MODULE_NOT_FOUND') {
    return false;
  }

  return typeof message === 'string' && message.includes(moduleName);
}

const plugins = OPTIONAL_PLUGINS.map(resolvePlugin).filter(Boolean);

export default {
  plugins,
};
