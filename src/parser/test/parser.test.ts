import test from "ava"
import parser from "../pegjs/parser"
import { prettyPrint, startDivider, endDivider, wrapText } from "../../util/consoleUtils"
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
        let resultJSON = JSON.stringify( result, ( k, v ) => k == "location" ? undefined : v )
        // console.log( wrapText( resultJSON ) )
        let expectedStr = ( expected as string[] ).join( "" )
        t.deepEqual( resultJSON, expectedStr )
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
            'n","args":[],"body":{"type":"Block","bod',
            'y":[{"type":"Assignment","left":{"type":',
            '"Identifier","name":"a"},"right":{"type"',
            ':"Literal","value":10}}]}}},{"type":"Ass',
            'ignment","left":{"type":"Identifier","na',
            'me":"b"},"right":{"type":"Literal","valu',
            'e":1}}]}}'
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
            '"},"expression":{"type":"FunctionExpression","args":[],"bod',
            'y":{"type":"Block","body":[{"type":"Assignment","left":{"ty',
            'pe":"Identifier","name":"a"},"right":{"type":"Literal","val',
            'ue":10}},{"type":"FunctionDeclaration","name":{"type":"Iden',
            'tifier","name":"foo"},"expression":{"type":"FunctionExpress',
            'ion","args":[],"body":{"type":"Block","body":[{"type":"Assi',
            'gnment","left":{"type":"Identifier","name":"a"},"right":{"t',
            'ype":"Literal","value":2}}]}}}]}}},{"type":"Assignment","le',
            'ft":{"type":"Identifier","name":"b"},"right":{"type":"Liter',
            'al","value":1}},{"type":"Assignment","left":{"type":"Identi',
            'fier","name":"c"},"right":{"type":"Literal","value":"hello ',
            'world!"}},{"type":"CallExpression","callee":{"type":"Identi',
            'fier","name":"foo"},"args":{"type":"Arguments","values":[]}',
            '}]}}'
        ]
    ]
]