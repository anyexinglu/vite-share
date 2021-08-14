import WebSocket, { WebSocketServer } from "ws";

const HMR_HEADER = "saber-hmr";

// console.log("...WebSocket.Server", WebSocket.Server, WebSocket);

export function createWebSocketServer(wsServer) {
  let wss = new WebSocketServer({ noServer: true }); // { noServer: true }
  // wsServer.on('upgrade', (req, socket, head) => {
  //   if (req.headers['sec-websocket-protocol'] === HMR_HEADER) {
  //     wss.handleUpgrade(req, socket, head, (ws) => {
  //       wss.emit('connection', ws, req)
  //     })
  //   }
  // })

  wsServer.on("upgrade", (req, socket, head) => {
    console.log("...upgrade");
    if (req.headers["sec-websocket-protocol"] === HMR_HEADER) {
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", socket => {
    console.log(`has connected`);
    socket.send(JSON.stringify({ type: "connected" }));
    // if (bufferedError) {
    //   socket.send(JSON.stringify(bufferedError))
    //   bufferedError = null
    // }
  });

  wss.on("error", e => {
    console.error(`WebSocket error:\n${e.stack || e.message}`);
    if (e.code !== "EADDRINUSE") {
      console.error(`WebSocket server error:\n${e.stack || e.message}`);
    }
  });

  // let bufferedError = null;
  return {
    send(payload) {
      if (payload.type === "error" && !wss.clients.size) {
        // bufferedError = payload;
        return;
      }

      const stringified = JSON.stringify(payload);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringified);
        }
      });
    },

    close() {
      return new Promise((resolve, reject) => {
        wss.close(err => {
          if (err) {
            reject(err);
          } else {
            if (wsServer) {
              wsServer.close(err => {
                if (err) {
                  reject(err);
                } else {
                  resolve(undefined);
                }
              });
            } else {
              resolve(undefined);
            }
          }
        });
      });
    },
  };
}
