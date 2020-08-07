import test from "ava"
import parser from "../parser"
import { prettyPrint, startDivider, endDivider, wrapText } from "../../util/util"
import fs from "fs"

// test( "main", t => {
//     let source = fs.readFileSync( "src/parser/test/samplesource.loop", { encoding: "utf8" } )
//     let result = parser.parse( source )

//     startDivider( "AST for tests" )
//     console.log( wrapText( JSON.stringify( result ) ) )
//     endDivider()

//     startDivider( "Pretty AST" )
//     prettyPrint( result )
//     endDivider()

//     t.pass()
// } )

test( "input output pairs", t => {
    for ( let [ source, expected ] of testPairs ) {
        let result = parser.parse( source )
        // console.log( wrapText( JSON.stringify( result ) ) )
        let expectedStr = ( expected as string[] ).join( "" )
        t.deepEqual( JSON.stringify( result ), expectedStr )
    }
    t.pass()
} )

const testPairs = [
    [
        `
                foo() {
                    a = 10
                }
                b = 1
            `,
        [
            '{"type":"Program","body":{"type":"Block"',
            ',"body":[{"type":"FunctionDeclaration","',
            'name":{"type":"Identifier","name":"foo"}',
            ',"expression":{"type":"FunctionExpressio',
            'n","arguments":[],"body":{"type":"Block"',
            ',"body":[{"type":"Assignment","left":{"t',
            'ype":"Identifier","name":"a"},"right":{"',
            'type":"Literal","value":10}}]}}},{"type"',
            ':"Assignment","left":{"type":"Identifier',
            '","name":"b"},"right":{"type":"Literal",',
            '"value":1}}]}}'
        ]
    ],
    [
        `
                foo() {
                    a = 10
                    foo() {
                        a = 2
                    }
                } 
                b = 1 
                c = "hello world!"
                foo()
            `,
        [
            '{"type":"Program","body":{"type":"Block","body":[{"type":"F',
            'unctionDeclaration","name":{"type":"Identifier","name":"foo',
            '"},"expression":{"type":"FunctionExpression","arguments":[]',
            ',"body":{"type":"Block","body":[{"type":"Assignment","left"',
            ':{"type":"Identifier","name":"a"},"right":{"type":"Literal"',
            ',"value":10}},{"type":"FunctionDeclaration","name":{"type":',
            '"Identifier","name":"foo"},"expression":{"type":"FunctionEx',
            'pression","arguments":[],"body":{"type":"Block","body":[{"t',
            'ype":"Assignment","left":{"type":"Identifier","name":"a"},"',
            'right":{"type":"Literal","value":2}}]}}}]}}},{"type":"Assig',
            'nment","left":{"type":"Identifier","name":"b"},"right":{"ty',
            'pe":"Literal","value":1}},{"type":"Assignment","left":{"typ',
            'e":"Identifier","name":"c"},"right":{"type":"Literal","valu',
            'e":"hello world!"}},{"type":"CallExpression","callee":{"typ',
            'e":"Identifier","name":"foo"},"arguments":[]}]}}'
        ]
    ]
]