import parser from "./pegjs/parser"
import postprocess from "./postprocess/postprocess"
export default function parse( source ) {
    return postprocess( parser.parse( source ) )
}