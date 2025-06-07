const createCounter = () => {
  let count = -1;
  return () => ++count;
};

const nextNumber = createCounter();

module.exports = { createCounter, nextNumber };