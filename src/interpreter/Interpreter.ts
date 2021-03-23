import { prettyPrint, colors, fail, warn, success } from "../util/consoleUtils"
import { evalOperation } from "../operators"
import { Scope } from "./Scope"
import { Task } from "./Task"
import { NativeBindings, NativeFunction } from "."
import TaskHandlers from "./TaskHandlers"
import parse from "../parser/parse"

type Location = { start: LocationPart, end: LocationPart }
type LocationPart = { offset: number, column: number, row: number }

export default class Interpreter {
    task?: Task
    engineScope: Scope
    nativeBindings?: NativeBindings
    source?: string

    constructor( source: string ) {
        this.source = source
        let ast = parse( source )
        this.engineScope = new Scope()
        this.task = Task.root( ast, this.engineScope )
    }

    setNatives( nativeBindings: NativeBindings ) {
        this.nativeBindings = nativeBindings
        for ( let name in nativeBindings ) {
            if ( !this.engineScope.get( name ) )
                this.engineScope.set( name, new NativeFunction( name ) )
        }
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
            // console.log(this.location)
        }
        if ( this.task )
            warn( `Program reached the maximum number of allowed steps. (${ maxSteps })` )
        else
            success( `Program finished in ${ step - 1 } steps.` )
    }

    get location(): Location | undefined {
        return this.task?.node?.location
    }

}