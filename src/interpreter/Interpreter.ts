export default class Interpreter {
    context?: Context
    engineScope: Scope

    constructor( ast ) {
        this.engineScope = new Scope()
        this.context = Context.root( ast, this.engineScope )
    }

    step( natives: NativeBindings ) {
        type Stepper = ( context: Context ) => Context | void
        const steppers: { [ key: string ]: Stepper } = {
            Program: context => {
                if ( context.step == 0 )
                    return Context.child( context.node.body, context )
            },
            Block: context => {
                let { step, node } = context
                let { body } = node
                if ( step == 0 )
                    context.scope = new Scope( context.scope )
                if ( step < body.length )
                    return Context.child( body[ step ], context )
            },
            Literal: context => { context.returnValue( context.node.value ) },
            Identifier: context => { context.returnValue( context.scope.get( context.node.name ) ) },
            FunctionExpression: context => { context.returnValue( new Closure( context.node, context.scope ) ) },
            Assignment: context => {
                let { step, node } = context
                if ( step == 0 )
                    return Context.child( node.right, context, "rval" )
                if ( step == 1 )
                    context.scope.set( node.left.name, context.returns.rval )
            },
            CallExpression: context => {
                let { step, node } = context
                if ( step == 0 )
                    return Context.child( node.callee, context, "callee" )
                if ( step == 1 )
                    return Context.child( node.args, context, "args" )
                if ( step == 2 ) {
                    let args = context.returns.args
                    let callee = context.returns.callee
                    // console.log( { argsVal, calleeVal } )
                    if ( callee instanceof Closure ) {
                        let fnNode = callee.node
                        let fnScope = new Scope( callee.scope )

                        // Prepare scope with passed params.
                        for ( let i = 0; i < fnNode.args.length; i++ ) {
                            let name = fnNode.args[ i ].name
                            let value = args[ i ]
                            fnScope.setLocal( name, value )
                        }

                        let callCtx = Context.child( fnNode.body, context, "result" )
                        callCtx.scope = fnScope
                        return callCtx
                    } else if ( callee instanceof NativeFunction ) {
                        let native = natives[ callee.name ]
                        let result = native.apply( null, args )
                        context.returnValue( result )
                        context.step++ // Skip 
                    } else {
                        throw new Error( "Callee is not a function." )
                    }
                }
                if ( step == 3 ) {
                    context.returnValue( context.returns.result )
                }
            },
            Arguments: context => {
                let { step, node } = context
                let { values } = node
                if ( step == 0 )
                    context.returns = []
                if ( step < values.length )
                    return Context.child( values[ step ], context, step )
                context.returnValue( context.returns )
            }
        }

        let { context } = this
        if ( context ) {
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
    }

    run( nativeBindings: NativeBindings ) {
        for ( let name in nativeBindings )
            this.engineScope.set( name, new NativeFunction( name ) )
        while ( this.context )
            this.step( nativeBindings )
    }

}

type NativeBindings = { [ key: string ]: Function }
class NativeFunction {
    name: string
    constructor( name: string ) {
        this.name = name
    }
}

class Closure {
    node: any
    scope: Scope
    constructor( node, scope: Scope ) {
        this.node = node
        this.scope = scope
    }
}

class Context {
    step: number
    node: any
    parent?: Context
    scope!: Scope
    returnKey?: string | number
    returns: any

    private constructor( node ) {
        this.step = 0
        this.node = node
    }

    static child( node, parent: Context, returnKey?: string | number ) {
        let result = new Context( node )
        result.parent = parent
        result.scope = parent?.scope
        result.returnKey = returnKey
        return result
    }

    static root( ast, engineScope: Scope ) {
        let result = new Context( ast )
        result.scope = engineScope
        return result
    }

    returnValue( value ) {
        if ( this.parent && this.returnKey !== undefined ) {
            this.parent.returns = this.parent.returns ?? {}
            this.parent.returns[ this.returnKey ] = value
        }
    }
}

class Scope {
    parent?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.parent = parent }
    lookupScope( name ) {
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
        // console.log( { name, value } )
        let scope = this.lookupScope( name ) ?? this
        scope.values.set( name, value )
    }
    setLocal( name, value ) {
        this.values.set( name, value )
    }
}