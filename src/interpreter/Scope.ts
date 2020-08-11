import { Table } from "."

export class Scope {
    outerScope?: Scope
    values = new Table()
    constructor( parent?: Scope ) { this.outerScope = parent }
    private lookupScope( name ) {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
        let scope = this as Scope | undefined
        while ( scope ) {
            if ( scope.values.get( name ) !== undefined )
                return scope
            scope = scope.outerScope
        }
    }
    get( name ) {
        let values = this.lookupScope( name )?.values
        if ( values ) return values.get( name )
    }
    set( name, value ) {
        let scope = this.lookupScope( name ) ?? this
        scope.values.set( name, value )
    }
    setLocal( name, value ) {
        this.values.set( name, value )
    }
}
