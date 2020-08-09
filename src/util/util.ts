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