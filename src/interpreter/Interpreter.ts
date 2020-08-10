import { prettyPrint, colors, fail, warn, success } from "../util/consoleUtils"
import { evalOperation } from "../operators"
import { Scope } from "./Scope"
import { Task } from "./Task"
import { NativeBindings, NativeFunction } from "."
import TaskHandlers from "./TaskHandlers"

export default class Interpreter {
    task?: Task
    engineScope: Scope
    nativeBindings?: NativeBindings

    constructor( ast ) {
        this.engineScope = new Scope()
        this.task = Task.root( ast, this.engineScope )
    }

    setNatives( nativeBindings: NativeBindings ) {
        this.nativeBindings = nativeBindings
        for ( let name in nativeBindings )
            this.engineScope.set( name, new NativeFunction( name ) )
        return this
    }

    step() {
        let { task } = this
        if ( task ) {
            let type = task.node.type
            let handler = TaskHandlers[ type ]

            if ( !handler ) {
                fail( "\nError: No step handler for type " + type )
                process.stdout.write( colors.red )
                prettyPrint( task.node )
                console.log( colors.reset )
                throw new Error( "No step handler for type " + type )
            }

            let stepper = typeof handler == "function" ? handler : handler.step
            let next = stepper( task, this )
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

    run( maxSteps = Infinity ) {
        let step = 0
        while ( this.task ) {
            if ( step++ == maxSteps ) break
            this.step()
        }
        if ( this.task )
            warn( `Program reached the maximum number of allowed steps. (${ maxSteps })` )
        else
            success( `Program finished in ${ step - 1 } steps.` )
    }

}