// Core stream implementation
const createStream = (initialValue = null) => {
  let value = initialValue;
  const observers = [];
  
  const stream = {
    get: () => value,
    set: (newValue) => {
      value = newValue;
      observers.forEach(observer => observer(value));
      return stream;
    },
    subscribe: (observer) => {
      observers.push(observer);
      if (value !== null) observer(value);
      return () => {
        const index = observers.indexOf(observer);
        if (index > -1) observers.splice(index, 1);
      };
    },
    map: (transform) => {
      const mapped = createStream();
      stream.subscribe(val => mapped.set(transform(val)));
      return mapped;
    },
    filter: (predicate) => {
      const filtered = createStream();
      stream.subscribe(val => {
        if (predicate(val)) filtered.set(val);
      });
      return filtered;
    },
    merge: (otherStream) => {
      const merged = createStream();
      stream.subscribe(val => merged.set(val));
      otherStream.subscribe(val => merged.set(val));
      return merged;
    }
  };
  
  return stream;
};

module.exports = { createStream };