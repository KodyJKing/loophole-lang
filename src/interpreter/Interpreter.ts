import { prettyPrint, switchMap } from "../util/util"

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
                else
                    context.returnUndefined()
            },
            Block: context => {
                let { step, node } = context
                let { body } = node
                if ( step == 0 )
                    context.scope = new Scope( context.scope )
                if ( step < body.length )
                    return Context.child( body[ step ], context )
                else
                    context.returnUndefined()
            },
            Literal: context => { context.returnValue( context.node.value ) },
            Identifier: context => { context.returnValue( context.scope.get( context.node.name ) ) },
            FunctionExpression: context => { context.returnValue( new Closure( context.node, context.scope ) ) },
            FunctionDeclaration: context => {
                let { node, scope } = context
                let { name, expression } = node
                scope.set( name.name, new Closure( expression, scope ) )
                context.returnUndefined()
            },
            Assignment: context => {
                let { step, node } = context
                if ( step == 0 )
                    return Context.child( node.right, context, "rval" )
                if ( step == 1 ) {
                    context.scope.set( node.left.name, context.returns.rval )
                    context.returnUndefined()
                }
            },
            CallExpression: context => {
                let { step, node } = context
                switch ( step ) {
                    case 0: return Context.child( node.callee, context, "callee" )
                    case 1: return Context.child( node.args, context, "args" )
                    case 2:
                        let args = context.returns.args
                        let callee = context.returns.callee
                        if ( callee instanceof Closure ) {
                            let fnNode = callee.node
                            let callCtx = Context.child( fnNode.body, context, "result" )
                            callCtx.scope = new Scope( callee.scope )
                            // Prepare scope with passed params.
                            for ( let i = 0; i < fnNode.args.length; i++ ) {
                                let name = fnNode.args[ i ].name
                                let value = args[ i ]
                                callCtx.scope.setLocal( name, value )
                            }
                            return callCtx

                        } else if ( callee instanceof NativeFunction ) {
                            let native = natives[ callee.name ]
                            let result = native.apply( null, args )
                            context.returnValue( result )
                            break

                        } else {
                            throw new Error( "Callee is not a function." )
                        }
                    case 3: context.returnValue( context.returns.result )
                }
            },
            Arguments: context => {
                let { step, node } = context
                let { values } = node
                if ( step == 0 ) context.returns = []
                if ( step < values.length ) return Context.child( values[ step ], context, step )
                context.returnValue( context.returns )
            },
            WhileStatement: context => {
                let { step, node, returns } = context
                switch ( step ) {
                    case 0: return Context.child( node.test, context, "test" )
                    case 1:
                        if ( !returns.test ) return context.returnUndefined()
                        return Context.child( node.body, context )
                    case 2:
                        return context.jump( 0 )
                }
            },
            BinaryOperation: context => {
                let { step, node } = context
                if ( step == 0 ) return Context.child( node.left, context, "left" )
                if ( step == 1 ) return Context.child( node.right, context, "right" )
                let l = context.returns.left
                let r = context.returns.right
                context.returnValue(
                    switchMap( node.operation, {
                        "==": () => l == r,
                        "+": () => l + r,
                        "-": () => l - r,
                        "*": () => l * r,
                        "/": () => l / r,
                        "**": () => l ** r,
                        default: () => { throw new Error( "Unsupported binary operation: " + node.operation ) }
                    } )
                )
            }
        }

        let { context } = this
        if ( context ) {
            let type = context.node.type
            let stepper = steppers[ type ]
            if ( !stepper ) {
                console.log( "\nNo stepper for type " + type )
                prettyPrint( context.node )
                console.log()
                throw new Error( "No stepper for type " + type )
            }
            let next = stepper( context )
            if ( context.done ) {
                context = context.parent
            } else {
                context.step++
                if ( next )
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
    done = false

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

    returnUndefined() { this.done = true }
    returnValue( value ) {
        this.done = true
        if ( this.parent && this.returnKey !== undefined ) {
            this.parent.returns = this.parent.returns ?? {}
            this.parent.returns[ this.returnKey ] = value
        }
    }

    jump( step ) {
        this.step = step - 1
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