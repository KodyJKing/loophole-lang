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
            '{"type":"Program","body":[{"type":"Fun',
            'ctionDeclaration","name":{"type":"Iden',
            'tifier","name":"foo"},"expression":{"t',
            'ype":"FunctionExpression","arguments":',
            '[],"body":[{"type":"Assignment","left"',
            ':{"type":"Identifier","name":"a"},"rig',
            'ht":{"type":"Literal","value":10}}]}},',
            '{"type":"Assignment","left":{"type":"I',
            'dentifier","name":"b"},"right":{"type"',
            ':"Literal","value":1}}]}'
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
            '{"type":"Program","body":[{"type":"FunctionDeclaration",',
            '"name":{"type":"Identifier","name":"foo"},"expression":{',
            '"type":"FunctionExpression","arguments":[],"body":[{"typ',
            'e":"Assignment","left":{"type":"Identifier","name":"a"},',
            '"right":{"type":"Literal","value":10}},{"type":"Function',
            'Declaration","name":{"type":"Identifier","name":"foo"},"',
            'expression":{"type":"FunctionExpression","arguments":[],',
            '"body":[{"type":"Assignment","left":{"type":"Identifier"',
            ',"name":"a"},"right":{"type":"Literal","value":2}}]}}]}}',
            ',{"type":"Assignment","left":{"type":"Identifier","name"',
            ':"b"},"right":{"type":"Literal","value":1}},{"type":"Ass',
            'ignment","left":{"type":"Identifier","name":"c"},"right"',
            ':{"type":"Literal","value":"hello world!"}},{"type":"Cal',
            'lExpression","callee":{"type":"Identifier","name":"foo"}',
            ',"arguments":[]}]}'
        ]
    ]
]