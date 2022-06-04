"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.interpret = interpret;
var swcHelpers = require("@swc/helpers");
var _lexer = swcHelpers.interopRequireDefault(require("./lexer"));
var _parser = swcHelpers.interopRequireDefault(require("./parser"));
var _interpreter = swcHelpers.interopRequireDefault(require("./interpreter"));
function interpret(code) {
    const tokens = _lexer.default.parse(code);
    const AST = _parser.default.parse(tokens);
    return (0, _interpreter).default(AST);
}
console.log('start');
interpret(`
[1,2,3,4]+[4,8]
`)().then((res)=>console.log(...res)
);
