import ionStringify from "./ionStringify"

export function prettyPrint( obj, indentation = 4 ) {
    console.log( ionStringify( obj, indentation ).replace( /"/g, "" ) )
}

export function startDivider( label?) {
    let line = "\n============================================="
    let lineChars = line.split( "" )
    let labelChars = ( "[ " + label + " ]" ).split( "" )
    lineChars.splice( 4, labelChars.length, ...labelChars )
    console.log( lineChars.join( "" ) )
}

export function endDivider() {
    console.log( "=============================================\n" )
}

export function wrapText( str, maxWidth?) {
    maxWidth = maxWidth ?? Math.floor( Math.sqrt( str.length * 4 ) )
    let regex = new RegExp( `.{1,${ maxWidth }}`, "g" )
    return str.match( regex )
}

export function switchMap( discriminant, cases ) {
    let caseHandler = cases[ discriminant ] || cases.default
    if ( caseHandler ) return caseHandler()
}

export function clone( obj ) {
    return JSON.parse( JSON.stringify( obj ) )
}

export function peek<T>( arr: Array<T> ) {
    return arr[ arr.length - 1 ]
}