import test from "ava"
import parser from "../../parser/parser"
import { prettyPrint, startDivider, endDivider, wrapText, clone } from "../../util/util"
import fs from "fs"
import ionStringify from "../../util/ionStringify"
import moveFunctionsToTop from "../../preprocess/moveFunctionsToTop"
import Interpreter from "../Interpreter"

test( "interpreter", t => {
    let source = fs.readFileSync( "src/parser/test/samplesource.loop", { encoding: "utf8" } )
    let ast = parser.parse( source )

    startDivider( "AST" )
    prettyPrint( ast, 2 )
    endDivider()

    moveFunctionsToTop( ast )

    let rt = new Interpreter( ast )
    rt.run()

    t.pass()
} )