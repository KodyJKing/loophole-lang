export class Scope {
    outerScope?: Scope
    values: { [ key: string ]: any } = {}
    constructor( parent?: Scope ) { this.outerScope = parent }
    private lookupScope( name ) {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
        let scope = this as Scope | undefined
        while ( scope ) {
            if ( scope.values[ name ] !== undefined )
                return scope
            scope = scope.outerScope
        }
    }
    get( name ) {
        name = "." + name
        let values = this.lookupScope( name )?.values
        if ( values ) return values[ name ]
    }
    set( name, value ) {
        // console.log( { name, value } )
        name = "." + name
        let scope = this.lookupScope( name ) ?? this
        scope.values[ name ] = value
    }
    setLocal( name, value ) {
        name = "." + name
        this.values[ name ] = value
    }
}
