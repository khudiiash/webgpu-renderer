class Storage {
    constructor(name, data) {
        this.name = name;
        this.data = data;
        this.isStorage = true;
        this.byteSize = data.byteLength;
    }
}