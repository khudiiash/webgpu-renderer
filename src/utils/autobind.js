export function autobind(context) {
    Object.getOwnPropertyNames(Object.getPrototypeOf(context))
        .filter(key => key !== 'constructor' && typeof context[key] === 'function')
        .forEach(key => {
            context[key] = context[key].bind(context);
        });
}