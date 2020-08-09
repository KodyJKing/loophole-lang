import test from "ava"
import { prettyPrint, startDivider, endDivider, wrapText, clone } from "../../util/util"
import fs from "fs"
import ionStringify from "../../util/ionStringify"
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
    rt.run( natives, 4000 )
    endDivider()

    t.pass()
} )