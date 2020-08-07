import { traverse } from "./traverse";

export default function moveFunctionsToTop( ast ) {
    traverse( ast, {
        leave: node => {
            switch ( node.type ) {
                case "Program":
                case "FunctionExpression":
                    let declarations = [] as any[]
                    let body = [] as any[]
                    for ( let stmt of node.body ) {
                        if ( stmt.type == "FunctionDeclaration" )
                            declarations.push( stmt )
                        else
                            body.push( stmt )
                    }
                    node.body = declarations.concat( body )
                    break;
                default:
                    break;
            }
        }
    } )
}