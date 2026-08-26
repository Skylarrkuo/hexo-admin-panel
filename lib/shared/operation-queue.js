'use strict';

function createOperationQueue() {
  let tail = Promise.resolve();
  return {
    run(operation) {
      const result = tail.then(operation, operation);
      tail = result.catch(() => {});
      return result;
    }
  };
}

module.exports = { createOperationQueue };
