/*
 * Backend for our GL game.
 * Sets up a signaling server to connect players to each other via WebRTC.
 */

const http = require("http");
const websocket = require("websocket");

const activeConnections = {};

/** A simple HTTP server that logs requests and returns NOT_FOUND. */
const httpServer = http.createServer((request, response) => {
  console.log(
    `Incoming HTTP request: ${request.method.toUpperCase()} ${request.url}`
  );
  response.writeHead(404, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
  });
  response.end("There be nothing to see here.");
});

const webSocketServer = new websocket.server({ httpServer });

/** When a client sends a WebSocket request, accept it and start listening. */
webSocketServer.on("request", (request) => {
  const clientId = request.resourceURL.path.split("/")[1];
  const connection = request.accept(null, request.origin);
  console.log(`New client has connected: ${clientId}`);

  // When a client sends a message, forward it to its recipient.
  connection.on("message", (data) => {
    if (data.type !== "utf8") {
      console.error(
        `Client ${clientId} tried sending data with invalid type: ${data.type}`
      );
    }

    console.log(`Incoming message from Client ${clientId}: ${data.utf8Data}`);
    const message = JSON.parse(data.utf8Data);
    const recipientId = message.id;
    const recipient = activeConnections[recipientId];

    if (recipient) {
      message.id = clientId;
      const outgoingData = JSON.stringify(message);
      console.log(`Sending to Client ${recipientId}: ${outgoingData}`);
      recipient.send(outgoingData);
    } else {
      console.error(`Recipient Client ${recipientId} not found`);
    }
  });

  // When a client disconnects, remove them from the server's active connections.
  connection.on("close", () => {
    delete activeConnections[clientId];
    console.error(`Client ${clientId} disconnected`);
  });

  activeConnections[clientId] = connection;
});

const port = process.env.PORT || 8000;
const hostname = process.env.HOSTNAME || "127.0.0.1";

httpServer.listen(port, hostname, () =>
  console.log(`Server listening on ${hostname}:${port}`)
);
