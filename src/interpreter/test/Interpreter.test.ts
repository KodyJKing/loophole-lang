import test from "ava"
import { prettyPrint, startDivider, endDivider } from "../../util/consoleUtils"
import fs from "fs"
import Interpreter from "../Interpreter"
import parse from "../../parser/parse"

test( "interpreter", t => {
    let source = fs.readFileSync( "src/interpreter/test/source.loop", { encoding: "utf8" } )
    let ast = parse( source )

    startDivider( "AST" )
    prettyPrint( ast, 2 )
    endDivider()

    startDivider( "Program Output" )
    let natives = { print: x => console.log( x ) }
    let rt = new Interpreter( ast )
    rt.run( natives, 10000 )
    endDivider()

    t.pass()
} )