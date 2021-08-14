const overlayId = "saber-error-overlay";
// use server configuration, then fallback to inference
const socketProtocol = "ws";
const socketHost = "localhost:3100";
const HMR_HEADER = "saber-hmr";

let socket;

try {
  const url = `${socketProtocol}://${socketHost}`;
  console.log("...socket url", url);
  socket = new WebSocket(url, HMR_HEADER);

  socket.onopen = function () {
    // Web Socket 已连接上，使用 send() 方法发送数据
    socket.send("发送数据");
  };
  // Listen for messages
  socket.onmessage = async ({ data }) => {
    console.log("Received Message: " + data);
    handleMessage(JSON.parse(data));
  };

  socket.onclose = function (event) {
    // handle error event
    console.error("WebSocket onClose:", event);
  };
  socket.onerror = function (event) {
    // handle error event
    console.error("WebSocket error observed:", event);
  };
} catch (e) {
  console.log("...socket e", e);
}

const base = "/"; //  __BASE__ ||

async function handleMessage(payload) {
  console.log(`handle Message: `, payload);
  switch (payload.type) {
    case "connected":
      console.log(`[vite] connected.`);
      // proxy(nginx, docker) hmr ws maybe caused timeout,
      // so send ping package let ws keep alive.
      setInterval(() => socket.send("ping"), 4000);
      break;
    case "update":
      // if this is the first update and there's already an error overlay, it
      // means the page opened with existing server compile error and the whole
      // module script failed to load (since one of the nested imports is 500).
      // in this case a normal update won't work and a full reload is needed.
      console.log("...will update view");
      // window.location.reload();
      // return;
      payload.updates.forEach(async update => {
        console.log("...queueUpdate(fetchUpdate(update));", update);
        const { timestamp, path } = update;
        await import(
          /* @vite-ignore */
          `/App?import&t=${timestamp}`
        );
        // queueUpdate(fetchUpdate(update));
      });

    // if (isFirstUpdate && hasErrorOverlay()) {
    //   // if this is the first update and there's already an error overlay, it
    //   // means the page opened with existing server compile error and the whole
    //   // module script failed to load (since one of the nested imports is 500).
    //   // in this case a normal update won't work and a full reload is needed.
    //   window.location.reload();
    //   return;
    // } else {
    //   clearErrorOverlay();
    //   isFirstUpdate = false;
    // }
  }
}

// const hotModulesMap = new Map(); // <string, HotModule>();
// const disposeMap = new Map(); // <string, (data: any) => void | Promise<void>>();
// const pruneMap = new Map(); // <string, (data: any) => void | Promise<void>>();
// const dataMap = new Map(); // <string, any>();

// async function fetchUpdate({ path, acceptedPath, timestamp }) {
//   try {
//     const mod = hotModulesMap.get(path);
//     console.log("...mod", mod);
//     if (!mod) {
//       // In a code-splitting project,
//       // it is common that the hot-updating module is not loaded yet.
//       // https://github.com/vitejs/vite/issues/721
//       return;
//     }

//     const moduleMap = new Map();
//     const isSelfUpdate = path === acceptedPath;

//     // make sure we only import each dep once
//     const modulesToUpdate = new Set(); // <string>();
//     if (isSelfUpdate) {
//       // self update - only update self
//       modulesToUpdate.add(path);
//     } else {
//       // dep update
//       for (const { deps } of mod.callbacks) {
//         deps.forEach(dep => {
//           if (acceptedPath === dep) {
//             modulesToUpdate.add(dep);
//           }
//         });
//       }
//     }
//     // determine the qualified callbacks before we re-import the modules
//     const qualifiedCallbacks = mod.callbacks.filter(({ deps }) => {
//       return deps.some(dep => modulesToUpdate.has(dep));
//     });

//     await Promise.all(
//       Array.from(modulesToUpdate).map(async dep => {
//         const disposer = disposeMap.get(dep);
//         if (disposer) await disposer(dataMap.get(dep));
//         const [path, query] = dep.split(`?`);
//         try {
//           const newMod = await import(
//             /* @vite-ignore */
//             base +
//               path.slice(1) +
//               `?import&t=${timestamp}${query ? `&${query}` : ""}`
//           );
//           moduleMap.set(dep, newMod);
//         } catch (e) {
//           warnFailedFetch(e, dep);
//         }
//       })
//     );

//     return () => {
//       for (const { deps, fn } of qualifiedCallbacks) {
//         fn(deps.map(dep => moduleMap.get(dep)));
//       }
//       const loggedPath = isSelfUpdate ? path : `${acceptedPath} via ${path}`;
//       console.log(`[vite] hot updated: ${loggedPath}`);
//     };
//   } catch (e) {
//     console.log("...catched e", e);
//   }
// }

// function warnFailedFetch(err, path) {
//   // (err: Error, path: string | string[]) {
//   if (!err.message.match("fetch")) {
//     console.error(err);
//   }
//   console.error(
//     `[hmr] Failed to reload ${path}. ` +
//       `This could be due to syntax errors or importing non-existent ` +
//       `modules. (see errors above)`
//   );
// }

// let pending = false;
// let queued = []; // : Promise<(() => void) | undefined>[] = [];

// /**
//  * buffer multiple hot updates triggered by the same src change
//  * so that they are invoked in the same order they were sent.
//  * (otherwise the order may be inconsistent because of the http request round trip)
//  */
// async function queueUpdate(p) {
//   console.log("....queueUpdate", p);
//   //(p: Promise<(() => void) | undefined>) {
//   // queued.push(p);
//   // if (!pending) {
//   //   pending = true;
//   //   await Promise.resolve();
//   //   pending = false;
//   //   const loading = [...queued];
//   //   queued = [];
//   //   (await Promise.all(loading)).forEach(fn => fn && fn());
//   // }
// }

// const ctxToListenersMap = new Map();
// // <
// //   string,
// //   Map<string, ((customData: any) => void)[]>
// // >();
// const customListenersMap = new Map(); // <string, ((customData: any) => void)[]>();

// // Just infer the return type for now
// // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// export const createHotContext = ownerPath => {
//   if (!dataMap.has(ownerPath)) {
//     dataMap.set(ownerPath, {});
//   }

//   // when a file is hot updated, a new context is created
//   // clear its stale callbacks
//   const mod = hotModulesMap.get(ownerPath);
//   if (mod) {
//     mod.callbacks = [];
//   }

//   // clear stale custom event listeners
//   const staleListeners = ctxToListenersMap.get(ownerPath);
//   if (staleListeners) {
//     for (const [event, staleFns] of staleListeners) {
//       const listeners = customListenersMap.get(event);
//       if (listeners) {
//         customListenersMap.set(
//           event,
//           listeners.filter(l => !staleFns.includes(l))
//         );
//       }
//     }
//   }

//   const newListeners = new Map();
//   ctxToListenersMap.set(ownerPath, newListeners);

//   function acceptDeps(deps, callback = params => {}) {
//     const mod = hotModulesMap.get(ownerPath) || {
//       id: ownerPath,
//       callbacks: [],
//     };
//     mod.callbacks.push({
//       deps,
//       fn: callback,
//     });
//     hotModulesMap.set(ownerPath, mod);
//   }

//   const hot = {
//     get data() {
//       return dataMap.get(ownerPath);
//     },

//     accept(deps, callback) {
//       if (typeof deps === "function" || !deps) {
//         // self-accept: hot.accept(() => {})
//         acceptDeps([ownerPath], ([mod]) => deps && deps(mod));
//       } else if (typeof deps === "string") {
//         // explicit deps
//         acceptDeps([deps], ([mod]) => callback && callback(mod));
//       } else if (Array.isArray(deps)) {
//         acceptDeps(deps, callback);
//       } else {
//         throw new Error(`invalid hot.accept() usage.`);
//       }
//     },

//     acceptDeps() {
//       throw new Error(
//         `hot.acceptDeps() is deprecated. ` +
//           `Use hot.accept() with the same signature instead.`
//       );
//     },

//     dispose(cb) {
//       // : (data: any) => void
//       disposeMap.set(ownerPath, cb);
//     },

//     prune(cb) {
//       pruneMap.set(ownerPath, cb);
//     },

//     // TODO
//     // eslint-disable-next-line @typescript-eslint/no-empty-function
//     decline() {},

//     invalidate() {
//       // TODO should tell the server to re-perform hmr propagation
//       // from this module as root
//       location.reload();
//     },

//     // custom events
//     on(event, cb) {
//       // on(event: string, cb: () => void) {
//       const addToMap = map => {
//         // : Map<string, any[]>
//         const existing = map.get(event) || [];
//         existing.push(cb);
//         map.set(event, existing);
//       };
//       addToMap(customListenersMap);
//       addToMap(newListeners);
//     },
//   };

//   return hot;
// };
