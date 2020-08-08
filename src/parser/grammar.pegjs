{ 
	function node( type, properties, addLocation = true ) {
		// if (addLocation) properties.location = location()
		return Object.assign( { type }, properties )
	}

	function buildPrecedences(groups) {
		let result = {} as any
		let p = 0
		for (let group of groups) {
			group.forEach(e => result[e] = p)
			p++
		}
		return result
	}
	const operatorPrecedences = buildPrecedences([
		["==", "!="],
		[">", "<", ">=", "<=" ],
		["+", "-"],
		["*", "/", "%"],
		["**"]
	])

	function orderOperations( operationChain ) {
		const nodeType = "BinaryOperation"
		let operands = [ operationChain.head ]
		let operators = []
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
				operation = ops[0]
			} else {
				operation = ops.reduce( ( a, b ) => operatorPrecedences[ a ] < operatorPrecedences[ b ] ? a : b )
				let index = ops.indexOf( operation )
				left = parse( ops.slice( 0, index ) )
				right = parse( ops.slice( index + 1, ops.length ) )
			}
			let properties =  { operation, left, right }
			if (left.location) properties.location = { start: left.start, end: right.end }
			return node( nodeType, properties, false )
		}
		return parse( operators )
	}

	function buildCallExpression( callChain ) {
		let leadCallee = callChain.head
		let argumentLists = callChain.tail
		const nodeType = "CallExpression"
		let i = 0
		let result = node( nodeType, { callee: leadCallee, args: argumentLists[ i++ ] } )
		while ( i < argumentLists.length )
			result = node( nodeType, { callee: result, args: argumentLists[ i++ ] } )
		return result
	}
}

start = Program

Program
	= body: Block { return node("Program", { body } ) }

Block
	= __ head: Statement tail: (__ res: Statement { return res } )* __ { return node("Block", { body: [head].concat(tail) } ) }
	/ __ { return node("Block", { body: [] }) }

Statement "statement"
	= IndexedAssignment / MemberAssignment / Assignment / WhileStatement / FunctionDeclaration / CallExpressionChain

IndexedAssignment
	= map: Term __ "[" __ index: Expression __ "]" __ "=" __ right: Expression { return node("IndexAssignment", { map, index, right } ) }

MemberAssignment
	= map: Term __ "." __ property: Identifier __ "=" __ right: Expression { return node("MemberAssignment", { map, property, right } ) }

Assignment
	= left: Identifier __ "=" __ right: Expression { return node("Assignment", { left, right } ) }

FunctionDeclaration
	= name: Identifier __ expression: FunctionExpression { return node("FunctionDeclaration", { name, expression } ) }

WhileStatement
	= WhileKeyword __ "(" __ test: Expression __ ")" __ "{" __ body: Block __ "}" { return node("WhileStatement", { test, body } ) }

Expression "expression"
	=  BinaryOperations / Term

	BinaryOperations
		= head: Term __ tail: ( operator: BinaryOperator __ operand: Term __ { return { operator, operand } } )+ 
		{ return orderOperations( { head, tail } ) }

	Term
		= CallExpressionChain / NonCallTerm

	NonCallTerm
		= Literal / Identifier / FunctionExpression / ParenthesisExpression

		ParenthesisExpression
			= "(" __ expression: Expression __ ")" { return expression }

	CallExpressionChain
		= head: NonCallTerm tail: ( __ "(" __ args: Arguments __ ")" { return args || [] } )+ { return buildCallExpression({ head, tail }) }

		Arguments
			= head: Expression tail: ( __ "," __ val: Expression { return val } )* { return node("Arguments", { values: [head].concat(tail) } ) }
				/ __ { return node("Arguments", { values: [] }) }

	FunctionExpression
		=  "(" __ args: ArgumentsDeclaration? __ ")" __ "{" __ body: Block __ "}" { return node("FunctionExpression", {  args: args || [], body })  }

		ArgumentsDeclaration
			= head: Expression tail: ( __ "," __ val: Identifier { return val } )* { return [head].concat(tail) }

	Literal "literal"
		= value: (Float / Integer / Boolean / String) { return node("Literal", { value } ) }
		
			Float
				= text: $(Integer "." PositiveInteger ("E" ("+" / "-") Integer)?) { return parseFloat(text) }
				
				PositiveInteger
					= digits: $([0-9]+) { return parseInt(digits) }

			Integer
				= digits: $("-"? [0-9])+ { return parseInt(digits) }

			Boolean
				= TrueKeyword { return true } / FalseKeyword { return false }

			Null
				= NullKeyword { return null }

			String
				= '"' DoubleStringChar* '"' { return JSON.parse(text()) }

				DoubleStringChar
					= [^\r\n\t\b\f"] / "\\" ([rn"] / "u" HexDigit HexDigit HexDigit HexDigit )

						HexDigit
							= [0-9A-Fa-f]

Identifier
	= text:$([a-zA-Z] [a-zA-Z0-9]*) { return node("Identifier", { name: text }) }

// =====================================================

BinaryOperator
	= "==" / "+" / "-" / "**" / "*" / "/"

LoopKeyword = "loop"
WhileKeyword = "while"
TrueKeyword = "true"
FalseKeyword = "false"
NullKeyword = "null"

Keyword = WhileKeyword / LoopKeyword / TrueKeyword / FalseKeyword / NullKeyword

// =====================================================

Newline
	= "\n" / "\r\n" / "\r"

WhiteSpace
	= "\t" / " "
    
Comment = 
	LineComment	/ MultiLineComment

	LineComment
		=  "//" (!Newline .)*

	MultiLineComment
		= "/*" (!"*/" .)* "*/"

__
	= (WhiteSpace /  Newline / Comment)*

_
	= WhiteSpace*

EOL
	= LineComment? Newline __