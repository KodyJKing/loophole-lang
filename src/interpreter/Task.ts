import { Scope } from "./Scope"
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

    jump( step ) {
        this.step = step - 1
    }
}
