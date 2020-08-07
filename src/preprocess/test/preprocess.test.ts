import test from "ava"
import parser from "../../parser/parser"
import { prettyPrint, startDivider, endDivider, wrapText, clone } from "../../util/util"
import fs from "fs"
import ionStringify from "../../util/ionStringify"
import moveFunctionsToTop from "../moveFunctionsToTop"

test( "preprocess", t => {
    // let source = fs.readFileSync( "src/parser/test/samplesource.loop", { encoding: "utf8" } )
    // let ast = parser.parse( source )

    // startDivider( "AST" )
    // prettyPrint( ast, 2 )
    // endDivider()

    // let transformedAst = clone( ast )
    // moveFunctionsToTop( transformedAst )
    // startDivider( "Transformed AST" )
    // prettyPrint( transformedAst, 2 )
    // endDivider()

    t.pass()
} )