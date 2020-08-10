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
        if ( this.task )
            this.task = this.task.stepAndGetNextTask( this )
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