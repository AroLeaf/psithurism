import { Node, Token } from '@aroleaf/parser';

declare module '@aroleaf/parser' {
  interface ParserContext {
    opLevel?: number
  }
}

export interface ParsedNode {
  type: string
  children: (ParsedNode | Token)[]
}


const program = new Node('program');
const assignment = new Node('assignment');
const pipe = new Node('pipe');
const conditional = new Node('conditional');
const call = new Node('call');
const list = new Node('list');
const array = new Node('array');
const literal = new Node('literal');


program.is(ctx => {
  while(ctx.current()) {
    ctx.expect(assignment, pipe);
    if (ctx.current()) ctx.discard('break');
  }
});


assignment.is(ctx => {
  ctx.expect('identifier');
  ctx.discard('assign');
  ctx.expect(pipe);
  return;
});


pipe.is(ctx => {
  const left = ctx.expect(conditional);
  if (ctx.assert('pipe') || ctx.assert('merge') || ctx.assert('expand')) {
    while(ctx.accept('pipe', 'merge', 'expand')) {
      ctx.expect(conditional);
    }
    return;
  }
  return left;
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
  ['ə'],
];

const operator = opLevels
  .map((ops, i) => new Node('operator', ctx => {
    const left = ctx.expect(operator[i + 1]);
    const filter = (t: Token) => ops.includes(t.value);
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
    const filter = (t: Token) => t.type === 'identifier' && !opLevels.flat().includes(t.value);
    if (ctx.assert(filter)) {
      while (ctx.accept(filter)) {
        ctx.expect(call);
      }
      return;
    }
    return left;
  }));


call.is(ctx => {
  let f: Token;
  if (f = <Token>ctx.accept('identifier', 'lambda')) {
    if (['-', '+'].includes(f.value) && ctx.assert('number')) {
      const num: Token = <Token>ctx.expect('number');
      num.raw = f.raw + num.raw;
      num.value = f.value + num.value;
      return num;
    }
    ctx.accept(literal);
  } else return ctx.expect(literal);
  return;
});


literal.is(ctx => ctx.expect('string', 'regex', 'number', list));


list.is(ctx => {
  if (!ctx.assert('parens_open')) return ctx.expect(array);
  ctx.discard('parens_open');
  ctx.expect(pipe);
  while (ctx.ignore('separator')) {
    ctx.expect(pipe);
  }
  ctx.discard('parens_close');
  return;
});


array.is(ctx => {
  ctx.discard('square_open');
  ctx.expect(pipe);
  while (ctx.ignore('separator')) {
    ctx.expect(pipe);
  }
  ctx.discard('square_close');
})


export { program as default };