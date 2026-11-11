import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
/** 依赖包的安装目录（不依赖对方是否导出 package.json） */
export function pkgDir(name: string): string {
  for (const p of require.resolve.paths(name) ?? []) { const d = join(p, name); if (existsSync(join(d, 'package.json'))) return d + '/'; }
  throw new Error(`找不到依赖 ${name}，请先在项目根目录运行 npm install`);
}
