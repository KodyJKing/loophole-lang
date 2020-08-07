export function node( type, properties ) {
    return Object.assign( { type }, properties )
}

const operatorPrecedences = {
    "==": 0,
    "+": 1, "-": 1,
    "*": 2, "/": 2,
    "**": 3
}
export function orderOperations( operationChain ) {
    const nodeType = "BinaryOperations"
    let operands = [ operationChain.head ]
    let operators = [] as string[]
    for ( let { operand, operator } of operationChain.tail ) {
        operands.push( operand )
        operators.push( operator )
    }
    let operandIndex = 0
    function parse( ops ) {
        if ( ops.length == 0 ) return operands[ operandIndex++ ]
        if ( ops.length == 1 ) {
            return node( nodeType, {
                operation: ops[ 0 ],
                left: operands[ operandIndex++ ],
                right: operands[ operandIndex++ ]
            } )
        }
        let min = ops.reduce( ( a, b ) => operatorPrecedences[ a ] < operatorPrecedences[ b ] ? a : b )
        let minIndex = ops.indexOf( min )
        return node( nodeType, {
            operation: min,
            left: parse( ops.slice( 0, minIndex ) ),
            right: parse( ops.slice( minIndex + 1, ops.length ) )
        } )
    }
    return parse( operators )
}

export function buildCallExpression( callChain ) {
    let leadCallee = callChain.head
    let argumentLists = callChain.tail
    const nodeType = "CallExpression"
    let i = 0
    let result = node( nodeType, {
        callee: leadCallee,
        arguments: argumentLists[ i++ ]
    } )
    while ( i < argumentLists.length ) {
        result = node( nodeType, {
            callee: result,
            arguments: argumentLists[ i++ ]
        } )
    }
    return result
}