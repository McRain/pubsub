const _subscriptions = new Map()
const _managers = new Map()
const _paths = {}
const _subslist = {}

const _events = {};
const _subs = (event, once, handler) => {
	if (_events[event] == null)
		_events[event] = [];
	_events[event].push({ 'handler': handler, "once": once });
};

function Generate(cnt = 24) {
	const sym = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIKLMNOPQRSTUVWXYZ";
	let str = "";
	for (let i = 0; i < cnt; i++)
		str += sym[Math.floor(Math.random() * sym.length)];
	return str;
}

/**
 * Represents methods for subscribing and posting events to channels
 */
module.exports = class EventPub {

	static get Subs() {
		return _subslist
	}
	static get Paths() {
		return _paths
	}

	//#region PubSub

	/**
	 * Subscribes a function to a channel
	 * @param {String} path 
	 * @param {Function} handler
	 * @param {String} key optional - unique subscription key
	 * @param {String} networkId - no use this argument
	 */
	static Subscribe(path, handler, key, netId) {
		if (typeof handler !== 'function')
			throw new Error(`Handler must be function`)
		let container = _managers
		if (path.length > 0) {
			container = _subscriptions
			const paths = path.split('.')
			for (let i = 0; i < paths.length; i++) {
				const p = paths[i]
				if (!container.has(p))
					container.set(p, new Map())
				container = container.get(p)
			}
			if (!_paths[path])
				_paths[path] = 1
			else
				_paths[path]++
		}
		const k = key || Generate()
		container.set(k, {
			handler,
			id: netId
		})
		_subslist[path] = k
		EventPub.Emit("subscribe", path, k)
		return k
	}

	static Sub(...args) {
		EventPub.Subscribe.apply(null, args)
	}

	/**
	 * Unsubscribes from the channel by the specified key
	 * @param {String} path 
	 * @param {String} key 
	 */
	static Unsubscribe(path, key) {
		const paths = path.split('.')
		let container = _subscriptions
		for (let i = 0; i < paths.length; i++) {
			const p = paths[i]
			if (!container.has(p))
				continue
			container = container.get(p)
		}
		if (_paths[path]) {
			_paths[path]--
			if (_paths[path] === 0)
				delete _paths[path]
		}
		if (container) {
			if (container.has(key))
				container.delete(key)
		} else if (_managers[key]) {
			delete _managers[key]
			return
		}
		EventPub.Emit("unsubscribe", path)
	}

	/**
	 * Publication of the event in the channel. 
	 * The event will be received by subscribers including subscribed for part of the channel name
	 * @param {String,Array} path Separated Channel "." or array
	 * @param {Object} data Payload 
	 * @param {String} eventId Unique identifier (network)
	 * @param {Number} eventDate timestamp (network)
	 * @param {String} source Source (Network)
	 */
	static Publish(path, data, eventId, eventDate, source, target) {
		if (path && (typeof path === "string" || Array.isArray(path))) {
			if (!eventId) {
				eventId = Generate()
				eventDate = Date.now()
			}
			const errors = []
			const paths = Array.isArray(path) ? path : path.split('.')
			//-------------------------------
			_managers.forEach((v, k) => {
				v.handler(data, path, eventId, eventDate, source, target)
			})
			//------------------------------
			let root = _subscriptions
			const history = []
			for (let i = 0; i < paths.length; i++) {
				const currPath = paths[i]
				if (!root.has(currPath))
					continue
				root = root.get(currPath)
				root.forEach((v, k) => {
					if (v.handler) {
						if (target && target !== v.id)
							return
						if(v.id){
							if(history.includes(v.id))
								return
							history.push(v.id)
						}						
						v.handler(data, path, eventId, eventDate, source, target)
					}
				})
			}
			return errors
		}
		throw new Error(`Path must be string or array`)
	}

	/**
	 * Publication of the event in the channel. 
	 * The event will be received by subscribers including subscribed for part of the channel name
	 * @param {String,Array} path Separated Channel "." or array
	 * @param {Object} data Payload 
	 * @param {String} eventId Unique identifier (network)
	 * @param {Number} eventDate timestamp (network)
	 * @param {String} source Source (Network)
	 */
	static Pub(path, data, eventId, eventDate, source) {
		return EventPub.Publish(path, data, eventId, eventDate, source)
	}

	//#endregion

	//#region Events

	static On(event, handler) {
		_subs(event, false, handler);
	}
	static Once(event, handler) {
		_subs(event, true, handler);
	}
	static Off(event, handler) {
		const evt = _events[event];
		if (!evt)
			return;
		const l = evt.length;
		for (let i = l - 1; i >= 0; i--) {
			if (evt[i].handler === handler)
				evt.splice(i, 1);
		}
		if (evt.length === 0)
			delete _events[event];
	}
	static Emit(event) {
		const evs = _events[event];
		if (evs == null) return;
		const args = [...arguments];
		args.shift();
		const l = evs.length;
		for (let i = l - 1; i >= 0; i--) {
			const ev = evs[i];
			ev.handler.apply(null, args);
			if (!ev.once)
				continue;
			evs.splice(i, 1);
		}
	}
	//#endregion

}