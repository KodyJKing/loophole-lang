const operators = [
    [ "==", "!=" ],
    [ ">", "<", ">=", "<=" ],
    [ "+", "-" ],
    [ "*", "/", "%" ],
    [ "**" ]
]
export default operators
// console.log( operators.flat().map( op => JSON.stringify( op ) ).join( " / " ) )

export function evalOperation( operator: string, leftOperand, rightOperand ) {
    let operation = operations[ operator ]
    if ( !operation ) throw new Error( "Unsupported binary operation: " + operator )
    return operation( leftOperand, rightOperand )
}

const operations = ( () => {
    let result = {}
    for ( let op of operators.flat() ) result[ op ] = new Function( "a", "b", `return a ${ op } b` )
    return result as { [ key: string ]: ( a, b ) => any }
} )()

export const operatorPrecedences = buildPrecedenceTable( operators )
function buildPrecedenceTable( groups ) {
    let result = {}
    for ( let p = 0; p < groups.length; p++ )
        for ( let operator of groups[ p ] )
            result[ operator ] = p
    return result
}