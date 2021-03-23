import { Scope } from "./Scope"
import Interpreter from "./Interpreter"
import TaskHandlers from "./TaskHandlers"
import { fail, colors, prettyPrint } from "../util/consoleUtils"
export class Task {
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

    exit() { this.done = true }
    return( value ) {
        this.done = true
        if ( this.instigator && this.returnKey !== undefined ) {
            this.instigator.returns = this.instigator.returns ?? {}
            this.instigator.returns[ this.returnKey ] = value
        }
    }

    /** Call if jumping within tasks, otherwise call jumpInto. */
    jump( step ) {
        this.step = step - 1
    }

    /** Call if jumping from a different task, otherwise call jump. */
    jumpInto( step ) {
        this.step = step
    }

    /** Advances the state of the current task and possibly returns a different task to run. 
     * Returned task can be either a sub task or the instigating task. */
    stepAndGetNextTask( interpreter: Interpreter ) {
        let type = this.node.type
        let handler = TaskHandlers[ type ]

        if ( !handler ) {
            fail( "\nError: No step handler for type " + type )
            process.stdout.write( colors.red )
            prettyPrint( this.node )
            console.log( colors.reset )
            throw new Error( "No step handler for type " + type )
        }

        let next = handler.step( this, interpreter )
        if ( this.done ) {
            return this.instigator
        } else {
            this.step++
            if ( next )
                return next
        }

        return this
    }
}
