export interface State {
  variables: Map<string, any[]>;
  builtins: Record<string, Builtin>;
  i: number;
  $: any[];
}

export interface Builtin {
  operator: (state: State, left: any[], right: any[]) => any[];
  operand: (state: State, piped: any[], passed: any[]) => any[];
}