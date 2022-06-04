"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _parser = require("@aroleaf/parser");
const program = new _parser.Node('program');
const assignment = new _parser.Node('assignment');
const pipe = new _parser.Node('pipe');
const conditional = new _parser.Node('conditional');
const mulOrDiv = new _parser.Node('mul_or_div');
const addOrSub = new _parser.Node('add_or_sub');
const power = new _parser.Node('power');
const operator = new _parser.Node('operator');
const call = new _parser.Node('call');
const explicitList = new _parser.Node('list');
const array = new _parser.Node('array');
const literal = new _parser.Node('literal');
program.is((ctx)=>{
    ctx.expect(assignment);
    while(ctx.next()){
        ctx.discard('break');
        ctx.expect(assignment);
    }
    ctx.ignore('break');
});
assignment.is((ctx)=>{
    if (ctx.next()?.type !== 'assign') return ctx.expect(pipe);
    ctx.expect('identifier');
    ctx.discard('assign');
    ctx.expect(pipe);
    return;
});
pipe.is((ctx)=>{
    const left = ctx.expect(conditional);
    if (ctx.assert('pipe') || ctx.assert('merge') || ctx.assert('expand')) {
        while(ctx.accept('pipe', 'merge', 'expand')){
            ctx.expect(conditional);
        }
        return;
    }
    return left;
});
conditional.is((ctx)=>{
    const expr = ctx.expect(addOrSub);
    if (ctx.ignore('then')) {
        ctx.accept(conditional);
        if (ctx.accept('else')) ctx.expect(conditional);
        return;
    }
    return expr;
});
addOrSub.is((ctx)=>{
    const left = ctx.expect(mulOrDiv);
    if (ctx.assert('add') || ctx.assert('sub')) {
        while(ctx.accept('add', 'sub')){
            ctx.expect(mulOrDiv);
        }
        return;
    }
    return left;
});
mulOrDiv.is((ctx)=>{
    const left = ctx.expect(power);
    if (ctx.assert('mul') || ctx.assert('div') || ctx.assert('mod')) {
        while(ctx.accept('mul', 'div', 'mod')){
            ctx.expect(power);
        }
        return;
    }
    return left;
});
power.is((ctx)=>{
    const left = ctx.expect(operator);
    if (ctx.assert('pow')) {
        while(ctx.accept('pow')){
            ctx.expect(operator);
        }
        return;
    }
    return left;
});
operator.is((ctx)=>{
    const left = ctx.expect(call);
    if (ctx.assert('identifier')) {
        while(ctx.accept('identifier')){
            ctx.expect(call);
        }
        return;
    }
    return left;
});
call.is((ctx)=>{
    if (ctx.accept('identifier', 'pow', 'mul', 'div', 'mod', 'add', 'sub', 'assign')) {
        if (ctx.assert('parens_open')) ctx.expect(explicitList);
    } else return ctx.expect(literal);
    return;
});
literal.is((ctx)=>ctx.expect('string', 'regex', 'number', explicitList)
);
explicitList.is((ctx)=>{
    if (!ctx.assert('parens_open')) return ctx.expect(array);
    ctx.discard('parens_open');
    ctx.expect(pipe);
    while(ctx.ignore('separator')){
        ctx.expect(pipe);
    }
    ctx.discard('parens_close');
    return;
});
array.is((ctx)=>{
    ctx.discard('square_open');
    ctx.expect(pipe);
    while(ctx.ignore('separator')){
        ctx.expect(pipe);
    }
    ctx.discard('square_close');
});
exports.default = program;
