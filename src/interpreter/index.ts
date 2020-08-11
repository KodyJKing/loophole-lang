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

// We have to use these because we want to safely handle dangerous keys like __proto__ or constructor, 
// and we don't want to use Maps which would complicate cloning and comparison in Loophole.
export class Table {
    values: { [ key: string ]: any } = {}
    set( key: string, value: any ) {
        key = "." + key
        this.values[ key ] = value
    }
    get( key: string ) {
        key = "." + key
        return this.values[ key ]
    }
    keys() {
        return this.values.keys.map( key => key.slice( 1 ) )
    }
}