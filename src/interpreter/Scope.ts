export class Scope {
    outerScope?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.outerScope = parent }
    lookupScope( name ) {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
        let scope = this as Scope | undefined
        while ( scope ) {
            if ( scope.values.has( name ) )
                return scope
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
