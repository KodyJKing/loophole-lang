import { Task } from "./Task"
import { evalOperation } from "../operators"
import { Scope } from "./Scope"
import { NativeFunction, Closure } from "."
import Interpreter from "./Interpreter"

type StepFunction = ( task: Task, interpreter: Interpreter ) => Task | void
type TaskHandler = {
    step: StepFunction,
    continue?: StepFunction,
    break?: StepFunction
}

const taskHandlers: { [ key: string ]: StepFunction | TaskHandler } = {

    Program: task => {
        if ( task.step == 0 )
            return Task.child( task.node.body, task )
        else
            task.exit()
    },

    Block: task => {
        let { step, node } = task
        let { body } = node
        if ( step == 0 )
            task.scope = new Scope( task.scope )
        if ( step < body.length )
            return Task.child( body[ step ], task )
        else
            task.exit()
    },

    Literal: task => { task.return( task.node.value ) },

    Identifier: task => {
        let result = task.scope.get( task.node.name )
        if ( result == undefined )
            throw new Error( "Variable is not defined in current scope: " + task.node.name )
        task.return( result )
    },

    FunctionExpression: task => { task.return( new Closure( task.node, task.scope ) ) },

    FunctionDeclaration: task => {
        let { node, scope } = task
        let { name, expression } = node
        scope.set( name.name, new Closure( expression, scope ) )
        task.exit()
    },

    Assignment: task => {
        let { step, node } = task
        if ( step == 0 )
            return Task.child( node.right, task, "rval" )
        if ( step == 1 ) {
            task.scope.set( node.left.name, task.returns.rval )
            task.exit()
        }
    },

    BinaryOperation: task => {
        let { step, node } = task
        if ( step == 0 ) return Task.child( node.left, task, "left" )
        if ( step == 1 ) return Task.child( node.right, task, "right" )
        task.return( evalOperation( node.operation, task.returns.left, task.returns.right ) )
    },

    CallExpression: ( task, interpreter ) => {
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
                    if ( !interpreter.nativeBindings ) throw new Error( "No native bindings provided." )
                    let native = interpreter.nativeBindings[ callee.name ]
                    if ( !native ) throw new Error( "No native binding for " + callee.name + " provided." )
                    let result = native.apply( null, args )
                    task.return( result )
                    break

                } else {
                    throw new Error( `Callee (${ callee }) is not a function.` )
                }
            case 3: task.return( task.returns.result )
        }
    },

    Arguments: task => {
        let { step, node } = task
        let { values } = node
        if ( step == 0 ) task.returns = []
        if ( step < values.length ) return Task.child( values[ step ], task, step )
        task.return( task.returns )
    },

    IfStatement: task => {
        let { step, node, returns } = task
        switch ( step ) {
            case 0: return Task.child( node.test, task, "test" )
            case 1:
                if ( !returns.test ) return task.exit()
                return Task.child( node.body, task )
            case 2: task.exit()
        }
    },

    WhileStatement: {
        step: task => {
            let { step, node, returns } = task
            switch ( step ) {
                case 0: return Task.child( node.test, task, "test" )
                case 1:
                    if ( !returns.test ) return task.exit()
                    return Task.child( node.body, task )
                case 2:
                    return task.jump( 0 )
            }
        },
        continue: task => {
            task.jumpInto( 0 )
            return task
        },
        break: task => task.instigator
    },

    ForStatement: {
        step: task => {
            let { step, node, returns } = task
            let { init, test, update, body } = node
            switch ( step ) {
                case 0: return Task.child( init, task )
                case 1: return Task.child( test, task, "test" )
                case 2:
                    if ( !returns.test )
                        return task.exit()
                    else
                        return Task.child( body, task )
                case 3: return Task.child( update, task )
                case 4: return task.jump( 1 )
            }
        },
        continue: task => {
            task.jumpInto( 3 )
            return task
        },
        break: task => task.instigator
    },

    BreakStatement: ( task, interpreter ) => {
        let ancestorTask = task as Task | undefined
        while ( ancestorTask ) {
            let type = ancestorTask.node.type
            let handler = TaskHandlers[ type ]
            if ( handler.break )
                return handler.break( ancestorTask, interpreter )
            ancestorTask = ancestorTask.instigator
        }
    },

    ContinueStatement: ( task, interpreter ) => {
        let ancestorTask = task as Task | undefined
        while ( ancestorTask ) {
            let type = ancestorTask.node.type
            let handler = TaskHandlers[ type ]
            if ( handler.continue )
                return handler.continue( ancestorTask, interpreter )
            ancestorTask = ancestorTask.instigator
        }
    },

    ReturnStatement: task => {
        let { step, node } = task
        if ( step == 0 ) return Task.child( node.result, task, "result" )
        let ancestorTask = task as Task | undefined
        while ( ancestorTask ) {
            let instigatorType = ancestorTask.instigator?.node.type
            if ( instigatorType == "CallExpression" ) {
                ancestorTask.return( task.returns.result )
                return ancestorTask.instigator
            }
            ancestorTask = ancestorTask.instigator
        }
    }
}

const TaskHandlers: { [ key: string ]: TaskHandler } = {}
for ( let key in taskHandlers ) {
    let handler = taskHandlers[ key ]
    if ( typeof handler == "object" )
        TaskHandlers[ key ] = handler
    else
        TaskHandlers[ key ] = { step: handler }
}

export default TaskHandlers