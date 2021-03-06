import { Lexer, Token } from '@aroleaf/parser';

declare module '@aroleaf/parser' {
  interface Token {
    flags?: string
  }
}

const lexer = new Lexer();

interface TokenOptions {
  matches: string|RegExp
  discard?: boolean
  then?: (token: Token, match: RegExpExecArray, tokens: Token[]) => any
}

const tokens: { [key: string]: string|RegExp|TokenOptions } = {
  comment: {
    matches: /#[^\n]*/,
    discard: true,
  },
  pipe: '|',
  expand: '<',
  merge: '>',
  assign: '=',
  separator: ',',
  then: '?',
  else: ':',
  parens_open: '(',
  parens_close: ')',
  square_open: '[',
  square_close: ']',
  add: '+',
  sub: '-',
  mul: '*',
  div: '/',
  mod: '%',
  pow: '^',
  string: {
    matches: /'(?:[^'\\]|\\[^])*'|"(?:[^"\\]|\\[^])*"/s,
    then: t => t.value = t.value.slice(1,-1).replace(/\\([^])/g, sub => {
      switch(sub[1]) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'v': return '\v';
        case 'b': return '\b';
        case 'f': return '\f';
        default: return sub[1];
      }
    }),
  },
  regex: {
    matches: /\/((?:[^\/\\\n]|\\[^])*)\/([gimuynsxA]*)/s,
    then: (t, m) => {
      t.value.replaceAll('\\\n', '\n');
      t.flags = m[2];
    },
  },
  number: /-?(?:\d*\.)?\d+/,
  break: /;[\s;]*/s,
  identifier: /\w+|\S/,
  whitespace: {
    matches: /\s+/s,
    discard: true,
  },
}

for (const [name, options] of Object.entries(tokens)) {
  const token = lexer.token(name);
  if (typeof options === 'string' || options instanceof RegExp) token.matches(options);
  else {
    if (options.matches) token.matches(options.matches);
    if (options.discard) token.discard();
    if (options.then) token.then(options.then);
  }
}

export { lexer as default };

