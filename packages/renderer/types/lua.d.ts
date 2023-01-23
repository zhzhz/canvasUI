declare module 'lua'{
    export function initLua(): any
    export function luaParse(file:any): any
    export function runLua(): any
}