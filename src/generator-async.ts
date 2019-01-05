import { RoughGeneratorBase } from './generator-base';

export class RoughGeneratorAsync extends RoughGeneratorBase {
}

// (async () => {
//   let WAdder = workly.proxy(Adder);
//   let a = await new WAdder(); // instance created/running in worker
//   console.log(await a.count); // 0
//   console.log(await a.add(23, 16)); // 39
//   console.log(await a.count); // 1
// })();