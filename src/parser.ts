import { Node, Token } from '@aroleaf/parser';

const parser = new Node('program');
const func = new Node('function');
const pipe = new Node('pipe');

const loop = new Node('loop');
const assignment = new Node('assignment');
const lambda = new Node('lambda');
const conditional = new Node('conditional');
const call = new Node('call');

const list = new Node('list');
const array = new Node('array');
const literal = new Node('literal');


parser.is(ctx => {
  ctx.expect(func, pipe);
  while (ctx.ignore('break')) {
    ctx.accept(func, pipe);
  }
});


func.is(ctx => {
  ctx.expect('identifier');
  ctx.discard('function');
  ctx.expect(pipe);
});


pipe.is(ctx => {
  const left = ctx.expect(loop);
  if (ctx.assert('pipe')) {
    while (ctx.accept('pipe')) {
      ctx.expect(loop);
    }
    return;
  }
  return left;
});


loop.is(ctx => {
  const left = ctx.expect(assignment, lambda);
  if (ctx.ignore('loop')) {
    ctx.expect(loop);
    return;
  }
  return left;
});


assignment.is(ctx => {
  ctx.expect('identifier');
  ctx.discard('assign');
  ctx.expect(assignment, lambda);
});


lambda.is(ctx => {
  if(!ctx.ignore('lambda')) return ctx.expect(conditional);
  ctx.expect(lambda);
  return;
});


conditional.is(ctx => {
  const expr = ctx.expect(operator[0]);
  if(ctx.ignore('then')) {
    ctx.accept(conditional);
    if (ctx.accept('else')) ctx.expect(conditional);
    return;
  }
  return expr;
});


const opLevels = [
  ['≔'],
  ['∨'], ['⊻'], ['∧'],
  ['‖'], ['^'], ['&'],
  ['=', '≈', '≠', '≉'],
  ['>', '<', '≥', '≤'],
  ['«', '»'],
  ['+', '-'],
  ['*', '/', '%'],
  ['e', 'E'],
];

const operator = opLevels
  .map((ops, i) => new Node('operator', ctx => {
    const left = ctx.expect(operator[i + 1]);
    const filter = (t?: Token) => !!t && ops.includes(t.value);
    if (ctx.assert(filter)) {
      while (ctx.accept(filter)) {
        ctx.expect(operator[i + 1]);
      }
      return;
    }
    return left;
  }))
  .concat(new Node('operator', ctx => {
    const left = ctx.expect(call);
    const filter = (t?: Token) => !!t && t.type === 'identifier' && !opLevels.flat().includes(t.value);
    if (ctx.assert(filter)) {
      while (ctx.accept(filter)) {
        ctx.expect(call);
      }
      return;
    }
    return left;
  }));


call.is(ctx => {
  if (ctx.accept('identifier')) {
    ctx.accept(list);
    return;
  }
  return ctx.expect(list);
});


list.is(ctx => {
  if (!ctx.assert('parens_open')) return ctx.expect(array);
  ctx.discard('parens_open');
  if (ctx.accept(pipe)) while (ctx.ignore('separator')) ctx.expect(pipe);
  ctx.discard('parens_close');
  return;
});


array.is(ctx => {
  if (!ctx.assert('square_open')) return ctx.expect(literal);
  ctx.discard('square_open');
  if (ctx.accept(pipe)) while (ctx.ignore('separator')) ctx.expect(pipe);
  ctx.discard('square_close');
  return;
});


literal.is(ctx => ctx.expect('string', 'character', 'number', 'regex'));


export default parser;