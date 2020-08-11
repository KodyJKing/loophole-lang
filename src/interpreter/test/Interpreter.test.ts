import test from "ava"
import { prettyPrint, startDivider, endDivider } from "../../util/consoleUtils"
import fs from "fs"
import Interpreter from "../Interpreter"
import parse from "../../parser/parse"

test( "interpreter", t => {
    let source = fs.readFileSync( "src/samplesource/source.loop", { encoding: "utf8" } )
    let ast = parse( source )

    startDivider( "AST" )
    let strippedAST = JSON.parse( JSON.stringify( ast, ( k, v ) => k == "location" ? undefined : v ) )
    prettyPrint( strippedAST, 2 )
    endDivider()

    startDivider( "Program Output" )
    let natives = { print: x => console.log( x ) }
    let rt = new Interpreter( source ).setNatives( natives )
    rt.run( 10000 )
    endDivider()

    t.pass()
} )