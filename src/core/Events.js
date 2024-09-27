class Events {
    constructor() {
        this.globalEvents = new GlobalEvents();
        this._listeners = {}; 
        this._contexts = {};
    }
    
    subscribe(event, callback, context) {
        this.globalEvents.subscribe(event, callback, context);
    }
    
    unsubscibe(event, callback) {
        this.globalEvents.unsubscibe(event, callback);
    }
    
    broadcast(event, data) {
        this.globalEvents.broadcast(event, data);
    }

    on(event, callback, context) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
            this._contexts[event] = [];
        }
        this._listeners[event].push(callback);
        this._contexts[event].push(context);
    }
    
    off(event, callback) {
        if (!this._listeners[event]) {
            return;
        }
        this._listeners[event] = this._listeners[event].filter((listener, i) => {
            if (listener !== callback) {
                return listener;
            } else {
                this._contexts[event].splice(i, 1);
                return false;
            }
        });
    }
    
    emit(event, data) {
        if (!this._listeners[event]) {
            return;
        }
        this._listeners[event].forEach((listener, i) => {
            listener.call(this._contexts[event][i], data);
        });
    }

}

class GlobalEvents {
    static instance = null;
    constructor() {
        if (GlobalEvents.instance) {
            return GlobalEvents.instance;
        }
        this._listeners = {};
        this._contexts = {};
        GlobalEvents.instance = this;
    }
    
    subscribe(event, callback, context) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
            this._contexts[event] = [];
        }
        this._listeners[event].push(callback);
        this._contexts[event].push(context);
    }
    
    unsubscibe(event, callback) {
        if (!this._listeners[event]) {
            return;
        }
        this._listeners[event] = this._listeners[event].filter((listener, i) => {
            if (listener !== callback) {
                return listener;
            } else {
                this._contexts[event].splice(i, 1);
                return false;
            }
        });
    }
    
    broadcast(event, data) {
        if (!this._listeners[event]) {
            return;
        }
        this._listeners[event].forEach((listener, i) => {
            listener.call(this._contexts[event][i], data);
        });
    }
}

export { Events, GlobalEvents };