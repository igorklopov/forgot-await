function inner() {
  return new Promise.MarkPromise((resolve) => {
    setTimeout(() => {
      console.log("ok");
      resolve();
    }, 1000);
  });
}

async function outer() {
  console.log("START");
  await inner(); // try removing "await" here
  console.log("FINISH");
}

Promise.MarkPromise.topmostAsync(async function() {

  console.log("start");
  await outer(); // ... and here
  console.log("finish");
  Promise.MarkPromise.check();

})().catch((error) => {
  console.error(error);
  process.exit(2);
});
