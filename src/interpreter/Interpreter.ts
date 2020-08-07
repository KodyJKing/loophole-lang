import { peek } from "../util/util"

export default class Interpreter {
    scopes = [ new Scope() ]
    states = [] as State[]
    stack = [] as any[]

    constructor( ast ) {
        this.states.push( nodeState( ast ) )
    }

    run() {
        let { scopes, stack, states } = this
        let globals = scopes[ 0 ]

        function returnFromNode( value?) {
            let state = peek( states )
            if ( state.pushes ) stack.push( value )
        }

        const bodyStepper = ( state: State ) => {
            let { step, node } = state
            let { body } = node
            if ( step < body.length ) return nodeState( body[ step ], false )
        }

        const steppers: { [ key: string ]: Stepper } = {
            Program: bodyStepper,
            FunctionExpression: bodyStepper,
            Literal: state => returnFromNode( state.node.value ),
            Assignment: state => {
                let { step, node } = state
                switch ( step ) {
                    case 0: return nodeState( node.right )
                    case 1: peek( scopes ).set( node.left.name, stack.pop() )
                }
            },
            CallExpression: state => {
                // Ignore callee for now, just print args.
            }
        }

        while ( states.length > 0 ) {
            let state = peek( states )
            let type = state.node.type
            let stepper = steppers[ type ]
            if ( !stepper ) throw new Error( "No stepper for type " + type )
            let next = stepper( state )
            if ( !next ) {
                if ( nodeTypes[ type ]?.hasScope )
                    scopes.pop()
                states.pop()
            } else {
                if ( nodeTypes[ next.node.type ]?.hasScope )
                    scopes.push( new Scope() )
                state.step++
                states.push( next )
            }
        }

    }

}

const nodeTypes = {
    Program: {
        hasScope: true,
        // step: ( rt, state ) => {
        // }
    },
    FunctionExpression: {
        hasScope: true
    }
}

function nodeState( node, pushes = true ) { return { step: 0, node, pushes } }

type Stepper = ( state: State ) => State | void
type State = { step: number, node: any, pushes: boolean }

class Scope {
    parent?: Scope
    values = new Map<string, any>()
    constructor( parent?: Scope ) { this.parent = parent }
    lookupScope( name ): Scope | undefined {
        if ( this.values.has( name ) ) return this
        return this.parent?.lookupScope( name )
    }
    get( name ) { return this.lookupScope( name )?.get( name ) }
    set( name, value ) {
        if ( typeof name != "string" ) throw new Error( "Variable names must be strings." )
        let scope = this.lookupScope( name ) || this
        return scope.values.set( name, value )
    }
}