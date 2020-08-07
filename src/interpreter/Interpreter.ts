import { peek } from "../util/util"

export default class Interpreter {
    state?: State
    stack = [] as any[]

    constructor( ast ) {
        this.state = nodeState( ast )
    }

    step() {
        let { stack, state } = this

        if ( !state ) return

        function returnValue( value ) {
            if ( state?.pushes )
                stack.push( value )
        }

        const bodyStepper = ( state: State ) => {
            let { step, node } = state
            let { body } = node
            if ( step < body.length )
                return nodeState( body[ step ], state )
        }

        const steppers: { [ key: string ]: Stepper } = {
            Program: bodyStepper,
            FunctionExpression: bodyStepper,
            Literal: state => returnValue( state.node.value ),
            Assignment: state => {
                let { step, node } = state
                switch ( step ) {
                    case 0: return nodeState( node.right, state, true )
                    case 1: state.scope.set( node.left.name, stack.pop() )
                }
            },
            CallExpression: state => {
                console.log( "Call!" )
                // Ignore callee for now, just print args.
            }
        }

        let type = state.node.type
        let stepper = steppers[ type ]
        if ( !stepper )
            throw new Error( "No stepper for type " + type )
        let next = stepper( state )
        if ( !next ) {
            state = state.parent
        } else {
            state.step++
            state = next
        }

        this.state = state
    }

    run() {
        while ( this.state )
            this.step()
    }

}

function nodeState( node, parent?, pushes = true ) {
    let scope = parent?.scope ?? new Scope()
    return { step: 0, node, parent, scope, pushes }
}

type Stepper = ( state: State ) => State | void
type State = {
    step: number,
    node: any,
    parent?: State,
    scope: Scope,
    pushes: boolean
}

class Scope {
    parent?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.parent = parent }
    static checkName( name ) {
        if ( typeof name != "string" )
            throw new Error( "Variable names must be strings." )
    }
    lookupScope( name ): Scope | undefined {
        Scope.checkName( name )
        if ( this.values.has( name ) ) return this
        return this.parent?.lookupScope( name )
    }
    get( name ) {
        return this.lookupScope( name )?.get( name )
    }
    set( name, value ) {
        let scope = this.lookupScope( name ) || this
        return scope.values.set( name, value )
    }
}