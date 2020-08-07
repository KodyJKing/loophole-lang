{ let { node, orderOperations, buildCallExpression } = require("./index.js") }

start = Program

Program
	= body: Body { return node("Program", { body } ) }

Body
	= __ head: Statement tail: (__ res: Statement { return res } )* __ { return node("Block", { body: [head].concat(tail) } ) }

Statement "statement"
	= IndexedAssignment / MemberAssignment / Assignment / FunctionDeclaration / CallExpressionChain

IndexedAssignment
	= map: Term __ "[" __ index: Expression __ "]" __ "=" __ right: Expression { return node("IndexAssignment", { map, index, right } ) }

MemberAssignment
	= map: Term __ "." __ property: Identifier __ "=" __ right: Expression { return node("MemberAssignment", { map, property, right } ) }

Assignment
	= left: Identifier __ "=" __ right: Expression { return node("Assignment", { left, right } ) }

FunctionDeclaration
	= name: Identifier __ expression: FunctionExpression { return node("FunctionDeclaration", { name, expression } ) }

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
		= head: NonCallTerm tail: ( __ "(" __ args: Arguments? __ ")" { return args || [] } )+ { return buildCallExpression({ head, tail }) }

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
	= text:$([a-zA-Z] [a-zA-Z0-9]*) { return node("Identifier", { name: text }) } 

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