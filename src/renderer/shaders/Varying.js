class Varying {
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
    
    toString(location) {
        return `@location(${location}) ${this.name}: ${this.type}`;
    }
}

export { Varying };