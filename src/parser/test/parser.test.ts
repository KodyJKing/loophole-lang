import test from "ava"
import parser from "../parser"
import { prettyPrint, startDivider, endDivider } from "../../util/util"
import IndentPrinter from "../../util/IndentPrinter"
import fs from "fs"

function parsesTo( source, expected, t ) {
    let result = parser.parse( source )
    t.assert( JSON.stringify( result ) == expected )
}

test( "main", t => {
    let source = fs.readFileSync( "src/parser/test/samplesource.loop", { encoding: "utf8" } )
    let result = parser.parse( source )
    // let result = parser.parse( "a = 2 * 3 + 4 * 5 == 6 * 7 + 8 * 9 ** 2" )
    // let result = parser.parse( "foo(1, 2, 3)()" )


    startDivider( "JSON AST" )
    console.log( JSON.stringify( result ) )
    endDivider()

    startDivider( "Pretty AST" )
    prettyPrint( result )
    endDivider()

    t.pass()
} )

test( "function and statement", t => {
    let source = `
        foo() {
            a = 10
        }
        b = 1
    `
    let expected = `{"type":"Program","body":[{"type":"FunctionDeclaration","name":"foo","expression":{"type":"FunctionExpression","arguments":[],"body":[{"type":"Assignment","leftValue":"a","rightValue":{"type":"Literal","value":10}}]}},{"type":"Assignment","leftValue":"b","rightValue":{"type":"Literal","value":1}}]}`
    parsesTo( source, expected, t )
    t.pass()
} )