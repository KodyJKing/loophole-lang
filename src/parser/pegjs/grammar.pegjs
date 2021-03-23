{ 
	const { orderOperations, buildMemberCallExpression } = require("./index.js")
	function node( type, properties, addLocation = true) {
		if (addLocation) properties.location = location()
		return Object.assign( { type }, properties )
	}
}

// =====================================================

Program
	= body: Block { return node("Program", { body } ) }

// =====================================================

Statement "statement"
	= MemberAssignment / Assignment
	 / IfStatement / WhileStatement / ForStatement
	 / BreakStatement / ContinueStatement / ReturnStatement
	 / FunctionDeclaration / MemberOrCallChain

Assignment "assignment"
	= left: Identifier __ "=" __ right: Expression { return node("Assignment", { left, right } ) }

MemberAssignment "member assignment"
	= left: MemberOrCallChain &{ return left.type == "MemberExpression" } __ "=" __ right: Expression { return node("MemberAssignment", { left, right } ) }

FunctionDeclaration "function declaration"
	= name: Identifier __ expression: FunctionExpression { return node("FunctionDeclaration", { name, expression } ) }

IfStatement "if"
	= IfKeyword  __ "(" __ test: Expression __ ")" __ body: ControlBody { return node("IfStatement", { test, body } ) }

WhileStatement "while"
	= WhileKeyword __ "(" __ test: Expression __ ")" __ body: ControlBody { return node("WhileStatement", { test, body } ) }

ForStatement "for"
	= ForKeyword __ "(" __ init:Statement __ ";" __ test:Expression __ ";" __ update:Statement __ ")" __ body:ControlBody 
		{ return node("ForStatement", { init, test, update, body } ) }

	ControlBody
		= Statement / ("{" __  body: Block __ "}" { return body } )

BreakStatement "break"
	= BreakKeyword { return node("BreakStatement", {}) }

ContinueStatement "continue"
	= ContinueKeyword { return node("ContinueStatement", {}) }

ReturnStatement "return"
	= ReturnKeyword __ result:Expression { return node("ReturnStatement", { result } ) }

Block
	= __ head: Statement tail: (__ res: Statement { return res } )* __ { return node("Block", { body: [head].concat(tail) } ) }
	/ __ { return node("Block", { body: [] }) }

// =====================================================

Expression "expression"
	=  BinaryOperationTree / Term

	BinaryOperationTree "binary operation"
		= head: Term __ tail: ( operator: BinaryOperator __ operand: Term __ { return { operator, operand } } )+ 
		{ return orderOperations( { head, tail } ) }

	Term
		= MemberOrCallChain / PrimaryTerm

	MemberOrCallChain
		= head: PrimaryTerm tail: ( __ operator:(CallOperator / MemberOperator) { return operator } )+ 
			{ return buildMemberCallExpression( { head, tail } ) }

		CallOperator "call"
			= "(" __ args: Arguments __ ")" { return node("CallExpression", { args } ) }

			Arguments "arguments"
				= head: Expression tail: ( __ "," __ val: Expression { return val } )* { return node("Arguments", { values: [head].concat(tail) } ) }
					/ __ { return node("Arguments", { values: [] }) }
		
		MemberOperator "member"
			= "[" __ key: Expression __ "]" { return node("MemberExpression", { key } ) }
				/ "." key: PropertyLiteral { return node("MemberExpression", { key } ) }

	PrimaryTerm
		= Literal / Identifier / FunctionExpression / ObjectLiteral / ( "(" __ expression: Expression __ ")" { return expression } )

	FunctionExpression "function"
		=  "(" __ args: ArgumentsDeclaration? __ ")" __ "{" __ body: Block __ "}" 
			{ return node("FunctionExpression", {  args: args || [], body })  }

		ArgumentsDeclaration "parameters"
			= head: Expression tail: ( __ "," __ val: Identifier { return val } )* { return [head].concat(tail) }

	ObjectLiteral "object"
		= "{" pairs: ( __ key: (Literal / PropertyLiteral) __ ":" __ value: Expression { return { key, value } } )* __ "}" 
			{ return node("ObjectLiteral", { pairs } ) }

	PropertyLiteral "property"
		= id: Identifier { return node("Literal", { value: id.name } ) }

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

	Identifier "identifier"
		= text:$(IdentifierStart IdentifierPart*) { return node("Identifier", { name: text }) }

// =====================================================

BinaryOperator
	=  "==" / "!=" / ">=" / "<=" / "**" / ">" / "<" / "+" / "-" / "*" / "/" / "%"

WhileKeyword = "while"
ForKeyword = "for"
IfKeyword = "if"
BreakKeyword = "break"
ContinueKeyword = "continue"
ReturnKeyword = "return"
TrueKeyword = "true"
FalseKeyword = "false"
NullKeyword = "null"

Keyword = WhileKeyword / ForKeyword / IfKeyword 
	/ BreakKeyword / ContinueKeyword / ReturnKeyword 
	/ TrueKeyword / FalseKeyword / NullKeyword

// =====================================================

IdentifierStart
	= [a-zA-Z]

IdentifierPart
	= [a-zA-Z0-9]

Newline "newline"
	= "\n" / "\r\n" / "\r"

WhiteSpace "whitespace"
	= "\t" / " "
    
Comment "comment"
	=  LineComment	/ MultiLineComment

	LineComment
		=  "//" (!Newline .)*

	MultiLineComment
		= "/*" (!"*/" .)* "*/"

__ "whitespace"
	= (WhiteSpace /  Newline / Comment)*

_ "whitespace"
	= WhiteSpace*

EOL
	= LineComment? Newline __