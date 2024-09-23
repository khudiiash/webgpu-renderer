class Varying {
    constructor(name, type, interpolation = 'perspective') {
        this.name = name;
        this.type = type;
        this.interpolation = interpolation;
    }
    
    toString(location) {
        return `@location(${location}) @interpolate(${this.interpolation}) ${this.name}: ${this.type}`;
    }
}

export { Varying };