export default class IndentPrinter {
    indentlevel: number = 0
    indentString = "    "
    constructor( indentString = "    " ) { this.indentString = indentString }
    outdent() { this.indentlevel++ }
    indent() { this.indentlevel-- }
    print( line ) {
        let dent = new Array( this.indentlevel + 1 ).join( this.indentString )
        console.log( dent + line )
    }
}