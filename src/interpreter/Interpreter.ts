import { prettyPrint, colors, fail, warn, success } from "../util/consoleUtils"
import { evalOperation } from "../operators"

export default class Interpreter {
    task?: Task
    engineScope: Scope

    constructor( ast ) {
        this.engineScope = new Scope()
        this.task = Task.root( ast, this.engineScope )
    }

    step( natives: NativeBindings ) {
        type Stepper = ( task: Task ) => Task | void
        const steppers: { [ key: string ]: Stepper } = {
            Program: task => {
                if ( task.step == 0 )
                    return Task.child( task.node.body, task )
                else
                    task.returnUndefined()
            },
            Block: task => {
                let { step, node } = task
                let { body } = node
                if ( step == 0 )
                    task.scope = new Scope( task.scope )
                if ( step < body.length )
                    return Task.child( body[ step ], task )
                else
                    task.returnUndefined()
            },
            Literal: task => { task.returnValue( task.node.value ) },
            Identifier: task => { task.returnValue( task.scope.get( task.node.name ) ) },
            FunctionExpression: task => { task.returnValue( new Closure( task.node, task.scope ) ) },
            FunctionDeclaration: task => {
                let { node, scope } = task
                let { name, expression } = node
                scope.set( name.name, new Closure( expression, scope ) )
                task.returnUndefined()
            },
            Assignment: task => {
                let { step, node } = task
                if ( step == 0 )
                    return Task.child( node.right, task, "rval" )
                if ( step == 1 ) {
                    task.scope.set( node.left.name, task.returns.rval )
                    task.returnUndefined()
                }
            },
            CallExpression: task => {
                let { step, node } = task
                switch ( step ) {
                    case 0: return Task.child( node.callee, task, "callee" )
                    case 1: return Task.child( node.args, task, "args" )
                    case 2:
                        let args = task.returns.args
                        let callee = task.returns.callee
                        if ( callee instanceof Closure ) {
                            let fnNode = callee.node
                            let callCtx = Task.child( fnNode.body, task, "result" )
                            callCtx.scope = new Scope( callee.scope )
                            // Prepare scope with passed params.
                            for ( let i = 0; i < fnNode.args.length; i++ )
                                callCtx.scope.setLocal( fnNode.args[ i ].name, args[ i ] )
                            return callCtx

                        } else if ( callee instanceof NativeFunction ) {
                            let native = natives[ callee.name ]
                            let result = native.apply( null, args )
                            task.returnValue( result )
                            break

                        } else {
                            throw new Error( `Callee (${ callee }) is not a function.` )
                        }
                    case 3: task.returnValue( task.returns.result )
                }
            },
            Arguments: task => {
                let { step, node } = task
                let { values } = node
                if ( step == 0 ) task.returns = []
                if ( step < values.length ) return Task.child( values[ step ], task, step )
                task.returnValue( task.returns )
            },
            IfStatement: task => {
                let { step, node, returns } = task
                switch ( step ) {
                    case 0: return Task.child( node.test, task, "test" )
                    case 1:
                        if ( !returns.test ) return task.returnUndefined()
                        return Task.child( node.body, task )
                    case 2: task.returnUndefined()
                }
            },
            WhileStatement: task => {
                let { step, node, returns } = task
                switch ( step ) {
                    case 0: return Task.child( node.test, task, "test" )
                    case 1:
                        if ( !returns.test ) return task.returnUndefined()
                        return Task.child( node.body, task )
                    case 2:
                        return task.jump( 0 )
                }
            },
            ForStatement: task => {
                let { step, node, returns } = task
                let { init, test, update, body } = node
                switch ( step ) {
                    case 0: return Task.child( init, task )
                    case 1: return Task.child( test, task, "test" )
                    case 2:
                        if ( !returns.test )
                            return task.returnUndefined()
                        else
                            return Task.child( body, task )
                    case 3: return Task.child( update, task )
                    case 4: return task.jump( 1 )
                }
            },
            BinaryOperation: task => {
                let { step, node } = task
                if ( step == 0 ) return Task.child( node.left, task, "left" )
                if ( step == 1 ) return Task.child( node.right, task, "right" )
                task.returnValue( evalOperation( node.operation, task.returns.left, task.returns.right ) )
            }
        }

        let { task } = this
        if ( task ) {
            let type = task.node.type
            let stepper = steppers[ type ]
            if ( !stepper ) {
                fail( "\nError: No stepper for type " + type )
                process.stdout.write( colors.red )
                prettyPrint( task.node )
                console.log( colors.reset )
                throw new Error( "No stepper for type " + type )
            }
            let next = stepper( task )
            if ( task.done ) {
                task = task.instigator
            } else {
                task.step++
                if ( next )
                    task = next
            }
            this.task = task
        }
    }

    run( nativeBindings: NativeBindings, maxSteps = Infinity ) {
        let step = 0
        for ( let name in nativeBindings )
            this.engineScope.set( name, new NativeFunction( name ) )
        while ( this.task ) {
            if ( step++ == maxSteps ) break
            this.step( nativeBindings )
        }
        if ( this.task )
            warn( `Program reached the maximum number of allowed steps. (${ maxSteps })` )
        else
            success( `Program finished in ${ step - 1 } steps.` )
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

class Task {
    step: number
    node: any
    instigator?: Task
    scope!: Scope
    private returnKey?: string | number
    returns: any
    done = false

    private constructor( node ) {
        this.step = 0
        this.node = node
    }

    static child( node, instigator: Task, returnKey?: string | number ) {
        let result = new Task( node )
        result.instigator = instigator
        result.scope = instigator?.scope
        result.returnKey = returnKey
        return result
    }

    static root( ast, engineScope: Scope ) {
        let result = new Task( ast )
        result.scope = engineScope
        return result
    }

    returnUndefined() { this.done = true }
    returnValue( value ) {
        this.done = true
        if ( this.instigator && this.returnKey !== undefined ) {
            this.instigator.returns = this.instigator.returns ?? {}
            this.instigator.returns[ this.returnKey ] = value
        }
    }

    jump( step ) {
        this.step = step - 1
    }

}

class Scope {
    outerScope?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.outerScope = parent }
    lookupScope( name ) {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
        let scope = this as Scope | undefined
        while ( scope ) {
            if ( scope.values.has( name ) ) return scope
            scope = scope.outerScope
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