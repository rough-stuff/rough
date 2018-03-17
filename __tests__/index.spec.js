import rough from '..';

// all test cases use them
let canvas = document.createElement('canvas');
let rc = rough.canvas(canvas);

// setup for each test case
beforeEach(() => {
  canvas = document.createElement('canvas');
  rc = rough.canvas(canvas);
});

describe('rough', () => {
  test(' - defined api', () => {
    expect(rough.canvas).toBeDefined();
    expect(rough.createRenderer).toBeDefined();
  });

  test(' - line', async () => {
    await rc.line(10, 10, 10, 10);
    expect(rc.ctx.moveTo).toHaveBeenCalledWith(10, 10);
  });

  // should fill test cases here.
});
