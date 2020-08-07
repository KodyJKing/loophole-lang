export default class Interpreter {
    context?: Context

    constructor( ast ) {
        this.context = new Context( ast )
    }

    step() {
        let { context } = this
        if ( context ) {
            let type = context.node.type
            let stepper = steppers[ type ]
            if ( !stepper )
                throw new Error( "No stepper for type " + type )
            let next = stepper( context )
            if ( !next ) {
                context = context.parent
            } else {
                context.step++
                context = next
            }
            this.context = context
        }
    }

    run() {
        while ( this.context )
            this.step()
    }

}

type Stepper = ( context: Context ) => Context | void
const steppers: { [ key: string ]: Stepper } = {
    Program: context => {
        if ( context.step == 0 )
            return new Context( context.node.body, context )
    },
    Block: context => {
        let { step, node } = context
        let { body } = node
        if ( step == 0 )
            context.scope = new Scope( context.scope )
        if ( step > 0 )
            context.stack.pop()
        if ( step < body.length )
            return new Context( body[ step ], context )
    },
    Literal: context => { context.returnValue( context.node.value ) },
    Identifier: context => { context.returnValue( context.scope.get( context.node.name ) ) },
    FunctionExpression: context => { context.returnValue( context.node ) },
    Assignment: context => {
        let { step, node } = context
        if ( step == 0 )
            return new Context( node.right, context )
        if ( step == 1 )
            context.scope.set( node.left.name, context.stack.pop() )
    },
    CallExpression: context => {
        let { step, node } = context
        let { callee, args } = node
        if ( step == 0 )
            return new Context( callee, context )
        if ( step == 1 )
            return new Context( args, context )
        if ( step == 2 ) {
            let argsVal = context.stack.pop()
            let calleeVal = context.stack.pop()
            console.log( { argsVal, calleeVal } )
            if ( calleeVal.type != "FunctionExpression" )
                throw new Error( "Callee is not a function." )
            let callCtx = new Context( calleeVal.body, context )
            callCtx.scope = new Scope()
            return callCtx
        }
    },
    Arguments: context => {
        let { step, node } = context
        let { values } = node
        if ( step < values.length )
            return new Context( values[ step ], context )
        context.returnValue( context.stack )
    }
}

class Context {
    step: number
    node: any
    parent?: Context
    scope: Scope
    stack: any[]
    constructor( node, parent?: Context ) {
        this.step = 0
        this.node = node
        this.parent = parent
        this.scope = parent?.scope ?? new Scope()
        this.stack = []
    }
    returnValue( value ) {
        this.parent?.stack.push( value )
    }
}

class Scope {
    parent?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.parent = parent }
    lookupScope( name ) {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
        let scope = this as Scope | undefined
        while ( scope ) {
            if ( scope.values.has( name ) ) return scope
            scope = scope.parent
        }
    }
    get( name ) {
        return this.lookupScope( name )?.values?.get( name )
    }
    set( name, value ) {
        console.log( { name, value } )
        let scope = this.lookupScope( name ) || this
        return scope.values.set( name, value )
    }
}