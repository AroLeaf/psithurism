export interface PsithurismContext {
  functions: { [key: string]: Function }
  pipes: Map<any, any[]>
  i: number
}