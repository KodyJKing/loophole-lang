import { Scope } from "./Scope"

export type NativeBindings = { [ key: string ]: Function }
export class NativeFunction {
    name: string
    constructor( name: string ) {
        this.name = name
    }
}

export class Closure {
    node: any
    scope: Scope
    constructor( node, scope: Scope ) {
        this.node = node
        this.scope = scope
    }
}