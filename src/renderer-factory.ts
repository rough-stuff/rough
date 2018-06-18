import { Config } from './core';
import { RoughRenderer } from './renderer';

const hasSelf = typeof self !== 'undefined';
const roughScript = hasSelf && self && self.document && self.document.currentScript && (self.document.currentScript as HTMLScriptElement).src;

export function createRenderer(config: Config): RoughRenderer {
  if (hasSelf && roughScript && self && (self as any).workly && config.async && (!config.noWorker)) {
    const worklySource = config.worklyURL || 'https://cdn.jsdelivr.net/gh/pshihn/workly/dist/workly.min.js';
    if (worklySource) {
      const code = `importScripts('${worklySource}', '${roughScript}');\nworkly.expose(self.rough.createRenderer());`;
      const ourl = URL.createObjectURL(new Blob([code]));
      return (self as any).workly.proxy(ourl);
    }
  }
  return new RoughRenderer();
}