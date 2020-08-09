import { traverse, forChildren } from "./traverse"

export default function postprocess( ast ) {
    ast = moveFunctionsToTop( ast )
    ast = computeMissingLocations( ast )
    return ast
}

function moveFunctionsToTop( ast ) {
    traverse( ast, {
        leave: node => {
            if ( node.type != "Block" )
                return
            let declarations = [] as any[]
            let body = [] as any[]
            for ( let stmt of node.body ) {
                if ( stmt.type == "FunctionDeclaration" )
                    declarations.push( stmt )
                else
                    body.push( stmt )
            }
            node.body = declarations.concat( body )
        }
    } )
    return ast
}

function computeMissingLocations( ast ) {
    traverse( ast, {
        leave: node => {
            if ( node.location ) return;
            type Location = { offset: number, column: number, line: number }
            let locations = [] as Location[]
            forChildren( node, child => {
                if ( child.location ) {
                    locations.push( child.location.start )
                    locations.push( child.location.end )
                }
            } )
            if ( locations.length == 0 ) return console.log( "no child locations!!!" )
            let start = locations.reduce( ( a, b ) => b.offset < a.offset ? b : a )
            let end = locations.reduce( ( a, b ) => b.offset > a.offset ? b : a )
            node.location = { start, end }
        }
    } )
    return ast
}