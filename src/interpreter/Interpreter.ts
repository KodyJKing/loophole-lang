export default class Interpreter {
    context?: Context
    stack = [] as any[]

    constructor( ast ) {
        this.context = new Context( ast )
    }

    step() {
        let { stack, context } = this
        if ( !context ) return

        function returnValue( value ) {
            if ( context?.pushes )
                stack.push( value )
        }


        type Stepper = ( context: Context ) => Context | void
        const steppers: { [ key: string ]: Stepper } = {
            Program: context => {
                if ( context.step == 0 )
                    return new Context( context.node.body, context, false )
            },
            Block: context => {
                let { step, node } = context
                let { body } = node
                if ( step < body.length )
                    return new Context( body[ step ], context )
                console.log( context.scope )
            },
            Literal: context => returnValue( context.node.value ),
            Identifier: context => returnValue( context.scope.get( context.node.name ) ),
            FunctionExpression: context => returnValue( context.node ),
            Assignment: context => {
                let { step, node } = context
                switch ( step ) {
                    case 0: return new Context( node.right, context, true )
                    case 1: context.scope.set( node.left.name, stack.pop() )
                }
            },
            CallExpression: context => {
                let { step, node } = context
                let { callee, arguments: args } = node

                if ( step == 0 )
                    return new Context( callee, context )

                let argNum = step - 1
                if ( argNum < args.length )
                    return new Context( args[ argNum ], context )

                let calleeValue = stack[ stack.length - args.length - 1 ]
                console.log( calleeValue )

                let end = stack.length
                let start = end - args.length
                console.log( stack.slice( start, end ) )

                stack.length -= args.length + 1
            }
        }

        let type = context.node.type
        let stepper = steppers[ type ]
        if ( !stepper )
            throw new Error( "No stepper for type " + type )
        let next = stepper( context )
        if ( !next ) {
            context = context.parent
        } else {
            context.step++
            context = next
        }

        this.context = context
    }

    run() {
        while ( this.context )
            this.step()
    }

}

class Context {
    step: number
    node: any
    parent?: Context
    scope: Scope
    pushes: boolean
    constructor( node, parent?: Context, pushes = true ) {
        this.step = 0
        this.node = node
        this.parent = parent
        this.scope = parent?.scope ?? new Scope()
        this.pushes = pushes
    }
}

class Scope {
    parent?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.parent = parent }
    lookupScope( name ): Scope | undefined {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
        let scope = this as Scope | undefined
        while ( scope ) {
            if ( scope.values.has( name ) ) return scope
            scope = scope.parent
        }
    }
    get( name ) {
        return this.lookupScope( name )?.values?.get( name )
    }
    set( name, value ) {
        let scope = this.lookupScope( name ) || this
        return scope.values.set( name, value )
    }
}