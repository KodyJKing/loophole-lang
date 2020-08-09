{ 
	const { orderOperations, buildCallExpression } = require("./index.js")
	function node( type, properties) {
		// properties.location = location()
		return Object.assign( { type }, properties )
	}
}

start = Program

Program
	= body: Block { return node("Program", { body } ) }

Block
	= __ head: Statement tail: (__ res: Statement { return res } )* __ { return node("Block", { body: [head].concat(tail) } ) }
	/ __ { return node("Block", { body: [] }) }

Statement "statement"
	= IndexedAssignment / MemberAssignment / Assignment / WhileStatement / ForStatement / FunctionDeclaration / CallExpressionChain

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

ForStatement
	= ForKeyword __ "(" __ init:Statement __ ";" __ test:Expression __ ";" __ update:Statement __ ")" __ "{" __  body: Block __ "}" { return node("ForStatement", { init, test, update, body } ) }

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
	=  "==" / "!=" / ">" / "<" / ">=" / "<=" / "+" / "-" / "*" / "/" / "%" / "**"

WhileKeyword = "while"
ForKeyword = "for"
TrueKeyword = "true"
FalseKeyword = "false"
NullKeyword = "null"

Keyword = WhileKeyword / ForKeyword / TrueKeyword / FalseKeyword / NullKeyword

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