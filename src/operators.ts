const operators = [
    [ "==", "!=" ],
    [ ">", "<", ">=", "<=" ],
    [ "+", "-" ],
    [ "*", "/", "%" ],
    [ "**" ]
]
export default operators

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

function pegjsRule() {
    let ops = operators.flat()
    // Sort the operators from largest to shortest so we don't accidentally match part of an operator.
    ops.sort( ( a, b ) => b.length - a.length )
    return ops.map( op => JSON.stringify( op ) ).join( " / " )
}
// console.log( pegjsRule() )
