import { Node, Token } from '@aroleaf/parser';

export interface ParsedNode {
  type: string
  children: (ParsedNode | Token)[]
}

const program = new Node('program');
const assignment = new Node('assignment');

const pipe = new Node('pipe');
const conditional = new Node('conditional');
const mulOrDiv = new Node('operator');
const addOrSub = new Node('operator');
const power = new Node('operator');
const operator = new Node('operator');
const call = new Node('call');
const list = new Node('list');
const array = new Node('array');

const literal = new Node('literal');

program.is(ctx => {
  ctx.expect(assignment, pipe);
  while(ctx.next()) {
    ctx.discard('break');
    ctx.expect(assignment, pipe);
  }
  ctx.ignore('break');
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
  const expr = ctx.expect(addOrSub);
  if(ctx.ignore('then')) {
    ctx.accept(conditional);
    if (ctx.accept('else')) ctx.expect(conditional);
    return;
  }
  return expr;
});

addOrSub.is(ctx => {
  const left = ctx.expect(mulOrDiv);
  if (ctx.assert('add') || ctx.assert('sub')) {
    while (ctx.accept('add', 'sub')) {
      ctx.expect(mulOrDiv);
    }
    return;
  }
  return left;
});

mulOrDiv.is(ctx => {
  const left = ctx.expect(power);
  if (ctx.assert('mul') || ctx.assert('div') || ctx.assert('mod')) {
    while (ctx.accept('mul', 'div', 'mod')) {
      ctx.expect(power);
    }
    return;
  }
  return left;
});

power.is(ctx => {
  const left = ctx.expect(operator);
  if (ctx.assert('pow')) {
    while (ctx.accept('pow')) {
      ctx.expect(operator);
    }
    return;
  }
  return left;
});

operator.is(ctx => {
  const left = ctx.expect(call);
  if (ctx.assert('identifier')) {
    while (ctx.accept('identifier')) {
      ctx.expect(call);
    }
    return;
  }
  return left;
});

call.is(ctx => {
  let f: Token;
  if (f = ctx.accept(
    'identifier',
    'pow',
    'mul', 'div', 'mod',
    'add', 'sub',
    'assign', 'lambda'
  )) {
    if (['add', 'sub'].includes(f.type) && ctx.assert('number')) {
      const num = ctx.expect('number');
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