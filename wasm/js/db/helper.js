import * as deasync from 'deasync';

export function wrapAsyncFunction(asyncFunction) {
  return function(...args) {
      let isDone = false;
      let error = null;
      let result = null;

      asyncFunction(...args)
          .then(res => {
              result = res;
              isDone = true;
          })
          .catch(err => {
              error = err;
              isDone = true;
          });

      while (!isDone) {
          deasync.runLoopOnce();
      }

      if (error) {
          throw error;
      }

      return result;
  };
}
