import { builtins as _builtins } from './builtins';

declare module globalThis {
  let builtins: typeof _builtins;
}

globalThis.builtins = _builtins;