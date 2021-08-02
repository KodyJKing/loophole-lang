import test, {ExecutionContext} from "ava"
import { prettyPrint, startDivider, endDivider } from "../../util/consoleUtils"
import fs from "fs"
import Interpreter from "../Interpreter"
import parse from "../../parser/parse"

function testScript(name: string, script: string, output) {
    test(name, t => {
        let rt = new Interpreter( script ).setNatives({ output: (value) =>  t.deepEqual(value, output)})
        rt.run()
    })
}

// test( "interpreter", t => {
//     let source = fs.readFileSync( "src/samplesource/source.loop", { encoding: "utf8" } )
//     let ast = parse( source )
//     // prettyPrint(ast)

//     startDivider( "AST" )
//     let strippedAST = JSON.parse( JSON.stringify( ast, ( k, v ) => k == "location" ? undefined : v ) )
//     prettyPrint( strippedAST, 2 )
//     endDivider()

//     startDivider( "Program Output" )
//     let natives = { print: x => console.log( x ) }
//     let rt = new Interpreter( source ).setNatives( natives )
//     rt.run( 10000 )
//     endDivider()

//     t.pass()
// } )


testScript(
    "squareSum",
    `
        result = 0
        for (i = 0; i < 5; i = i + 1)
            result = result + i * i
        output(result)
    `,
    30
)