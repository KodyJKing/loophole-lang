import { operatorPrecedences } from "../../operators"

function node( type, properties ) { return Object.assign( { type }, properties ) }

export function buildCallExpression( callChain ) {
    return callChain.tail.reduce( ( callee, args ) => node( "CallExpression", { callee, args } ), callChain.head )
}

export function orderOperations( operationChain ) {
    const nodeType = "BinaryOperation"
    let operands = [ operationChain.head ]
    let operators = [] as any
    for ( let { operand, operator } of operationChain.tail ) {
        operands.push( operand )
        operators.push( operator )
    }
    let operandIndex = 0
    function parse( ops ) {
        if ( ops.length == 0 ) return operands[ operandIndex++ ]
        let operation, left, right
        if ( ops.length == 1 ) {
            left = operands[ operandIndex++ ]
            right = operands[ operandIndex++ ]
            operation = ops[ 0 ]
        } else {
            // Find first of operators with highest precedence.
            operation = ops.reduce( ( a, b ) => operatorPrecedences[ a ] < operatorPrecedences[ b ] ? a : b )
            let index = ops.indexOf( operation )
            left = parse( ops.slice( 0, index ) )
            right = parse( ops.slice( index + 1, ops.length ) )
        }
        return node( nodeType, { operation, left, right } )
    }
    return parse( operators )
}

function buildPrecedenceTable( groups ) {
    let result = {}
    for ( let p = 0; p < groups.length; p++ )
        for ( let operator of groups[ p ] )
            result[ operator ] = p
    return result
}