{
    const operatorPrecedences = { 
		"==": 0,
		"+": 1, "-": 1, 
		"*": 2, "/": 2, 
		"**": 3 
	}

	function node( type, properties ) {
		return Object.assign( { type }, properties )
	}

	function orderOperations( operationChain ) {
		const nodeType = "BinaryOperations"
		let operands = [ operationChain.head ]
		let operators = []
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

	function buildCallExpression(callChain) {
		let leadCallee = callChain.head
		let argumentLists = callChain.tail
		const nodeType = "CallExpression"
		let i = 0
		let result = node(nodeType, {
			callee: leadCallee,
			arguments: argumentLists[i++]
		})
		while (i < argumentLists.length) {
			result = node(nodeType, {
				callee: result,
				arguments: argumentLists[i++]
			})
		}
		return result
	}

}

start = Program

Program
	= body: Body { return node("Program", { body } ) }

Body
	= __ head: Statement tail: (__ res: Statement { return res } )* __ { return [head].concat(tail) }

Statement "statement"
	= IndexedAssignment / MemberAssignment / Assignment / FunctionDeclaration / CallExpressionChain

IndexedAssignment
	= map: NonBinaryExpression __ "[" __ index: Expression __ "]" __ "=" __ rightValue: Expression { return node("IndexAssignment", { map, index, rightValue } ) }

MemberAssignment
	= map: NonBinaryExpression __ "." __ property: Identifier __ "=" __ rightValue: Expression { return node("MemberAssignment", { map, property, rightValue } ) }

Assignment
	= leftValue: Identifier __ "=" __ rightValue: Expression { return node("Assignment", { leftValue, rightValue } ) }

Expression "expression"
	=  BinaryOperations / AtomicExpression

BinaryOperations
    = head: NonBinaryExpression __ tail: ( operator: BinaryOperator __ operand: NonBinaryExpression __ { return { operator, operand } } )+ 
    { return orderOperations( { head, tail } ) }
 
ParenthesisExpression
	= "(" __ expression: Expression __ ")" { return expression }

NonBinaryExpression
	= CallExpressionChain / AtomicExpression

AtomicExpression
	= Literal / Identifier / ParenthesisExpression / FunctionExpression

CallExpressionChain
	= head: AtomicExpression tail: ( __ "(" __ args: Arguments? __ ")" { return args || [] } )+ { return buildCallExpression({ head, tail }) }

	Arguments
		= head: Expression tail: ( __ "," __ val: Expression { return val } )* { return [head].concat(tail) }

FunctionExpression
	=  "(" __ args: Arguments? __ ")" __ "{" __ statements: Body? __ "}" 
	{ 
		return node("FunctionExpression", { 
			arguments: args || [],
			body: statements || []
		}) 
	}

FunctionDeclaration
	= name: Identifier __ expression: FunctionExpression { return node("FunctionDeclaration", { name, expression } ) }

Literal "literal"
	= value: (Float / Integer / StringLiteral) { return node("Literal", { value } ) }
    
		Float
			= text: $(Integer "." PositiveInteger ("E" ("+" / "-") Integer)?) { return parseFloat(text) }
			
			PositiveInteger
				= digits: $([0-9]+) { return parseInt(digits) }

		Integer
			= digits: $("-"? [0-9])+ { return parseInt(digits) }

		StringLiteral
			= '"' DoubleStringChar* '"' { return JSON.parse(text()) }

			DoubleStringChar
				= [^\r\n\t\b\f"] / "\\" ([rn"] / "u" HexDigit HexDigit HexDigit HexDigit )

					HexDigit
						= [0-9A-Fa-f]

Identifier
	= text:$([a-zA-Z] [a-zA-Z0-9]*) { return text } 

BinaryOperator
	= "==" / "+" / "-" / "**" / "*" / "/"

Newline
	= "\n" / "\r\n" / "\r"

WhiteSpace
	= "\t" / " "
    
LineComment
	=  "//" (!Newline .)*

__
	= (WhiteSpace /  Newline / LineComment)*

_
	= WhiteSpace*

EOL
	= LineComment? Newline __