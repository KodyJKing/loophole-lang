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

export const colors = {
    black: "\u001b[30m",
    red: "\u001b[31m",
    green: "\u001b[32m",
    yellow: "\u001b[33m",
    blue: "\u001b[34m",
    magenta: "\u001b[35m",
    cyan: "\u001b[36m",
    white: "\u001b[37m",
    brightBlack: "\u001b[30;1m",
    brightRed: "\u001b[31;1m",
    brightGreen: "\u001b[32;1m",
    brightYellow: "\u001b[33;1m",
    brightBlue: "\u001b[34;1m",
    brightMagenta: "\u001b[35;1m",
    brightCyan: "\u001b[36;1m",
    brightWhite: "\u001b[37;1m",
    reset: "\u001b[0m"
}

export function fail( text ) { console.log( colors.red + text + colors.reset ) }
export function warn( text ) { console.log( colors.yellow + text + colors.reset ) }
export function success( text ) { console.log( colors.green + text + colors.reset ) }