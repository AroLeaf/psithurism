import { Lexer } from '@aroleaf/parser';

const lexer = new Lexer({
  comment: {
    matches: /#[^\n]*|#\[.*?\]#/s,
    discard: true,
  },
  pipe: /\||≺|≻/,
  portal: /⇥|⟼/,
  function: '⇒',
  loop: /⮔/,
  assign: '≔',
  lambda: 'λ',
  separator: ',',
  then: '?',
  else: ':',
  modifier: /⊙|⊕/,
  parens_open: '(',
  parens_close: ')',
  square_open: '[',
  square_close: ']',
  squiggly_open: '{',
  squiggly_close: '}',
  string: {
    matches: /'(?:\\.|[^'\\])*'/s,
    then: t => t.value = t.value.slice(1,-1).replace(/\\([^])/g, sub => sub[1]),
  },
  character: /"(.)/s,
  number: /(?:\d*\.)?\d+/,
  break: /;[\s;]*/s,
  identifier: /[a-zA-Z]+|\S/,
  whitespace: {
    matches: /\s+/s,
    discard: true,
  },
});

export default lexer;