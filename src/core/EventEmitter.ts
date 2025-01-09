// Types for event handling
export type EventCallback<T = any> = (data?: T) => void;

// Base event emitter that all event-capable objects will inherit from
export class EventEmitter {
    private _events: Map<string, Array<{ callback: EventCallback; scope?: any; once: boolean }>> = new Map();

    /**
     * Subscribe to an event
     * @param name Event name
     * @param callback Callback function
     * @param scope 'this' object to use when calling the callback
     */
    on<T = any>(name: string, callback: EventCallback<T>, scope?: any): this {
        let events = this._events.get(name);
        if (!events) {
            events = [];
            this._events.set(name, events);
        }
        events.push({ callback, scope, once: false });
        return this;
    }

    /**
     * Subscribe to an event for one time only
     */
    once<T = any>(name: string, callback: EventCallback<T>, scope?: any): this {
        let events = this._events.get(name);
        if (!events) {
            events = [];
            this._events.set(name, events);
        }
        events.push({ callback, scope, once: true });
        return this;
    }

    /**
     * Unsubscribe from an event
     */
    off(name: string, callback?: EventCallback, scope?: any): this {
        if (!callback) {
            // Remove all events of this name
            this._events.delete(name);
        } else {
            const events = this._events.get(name);
            if (events) {
                const newEvents = events.filter(event => {
                    if (scope) {
                        return event.callback !== callback || event.scope !== scope;
                    }
                    return event.callback !== callback;
                });
                if (newEvents.length === 0) {
                    this._events.delete(name);
                } else {
                    this._events.set(name, newEvents);
                }
            }
        }
        return this;
    }

    /**
     * Fire an event
     */
    fire<T = any>(name: string, data?: T): this {
        const events = this._events.get(name);
        if (!events) return this;

        const eventsToRemove: number[] = [];

        // Call all callbacks
        events.forEach((event, index) => {
            if (event.scope) {
                event.callback.call(event.scope, data);
            } else {
                event.callback(data);
            }
            
            if (event.once) {
                eventsToRemove.push(index);
            }
        });

        // Remove any 'once' events
        if (eventsToRemove.length > 0) {
            const newEvents = events.filter((_, index) => !eventsToRemove.includes(index));
            if (newEvents.length === 0) {
                this._events.delete(name);
            } else {
                this._events.set(name, newEvents);
            }
        }

        return this;
    }

    /**
     * Check if event has any subscribers
     */
    hasEvent(name: string): boolean {
        return this._events.has(name);
    }
}