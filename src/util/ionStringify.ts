export default function ionStringify( obj, indentation = 4, maxInlineLength = 60 ) {
    let dentPrime = new Array( indentation + 1 ).join( " " )
    function isValueType( object ) { return typeof object != "object" || object === null }

    function inlineStringify( obj ) {
        let result: string[] = []
        function internal( obj ) {
            if ( isValueType( obj ) )
                return result.push(
                    obj === undefined
                        ? "undefined"
                        : JSON.stringify( obj )
                )
            let i = 0
            if ( Array.isArray( obj ) ) {
                if ( obj.length == 0 )
                    return result.push( "[]" )
                result.push( "[ " )
                for ( let e of obj ) {
                    if ( i++ > 0 ) result.push( "," )
                    internal( e )
                }
                result.push( " ]" )
            } else {
                if ( Object.keys( obj ).length == 0 )
                    return result.push( "{}" )
                result.push( "{ " )
                for ( let k in obj ) {
                    let v = obj[ k ]
                    if ( i++ > 0 )
                        result.push( ", " )
                    result.push( k + ": " )
                    internal( v )
                }
                result.push( " }" )
            }
        }
        internal( obj )
        return result.join( "" )
    }

    let parts: string[] = []
    function internal( obj, dent ) {
        if ( isValueType( obj ) )
            return parts.push(
                obj === undefined
                    ? "undefined"
                    : JSON.stringify( obj )
            )
        let str = inlineStringify( obj )
        if ( str.length < maxInlineLength )
            return parts.push( str )
        dent = dent + dentPrime
        if ( Array.isArray( obj ) ) {
            parts.push( "[]" )
            for ( let e of obj ) {
                parts.push( "\n" + dent )
                internal( e, dent )
            }
        } else {
            parts.push( "{}" )
            for ( let k in obj ) {
                let v = obj[ k ]
                parts.push( "\n" + dent + k + ": " )
                internal( v, dent )
            }
        }
    }

    internal( obj, "" )
    return parts.join( "" )
}
