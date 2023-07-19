/** A WebSocket-based signaling server. */

const websocket = require("websocket");
const { httpServer } = require("./http-server");

/** Contains all clients connected to the server. */
const activeConnections = {};

/** The WebSocket Server. */
const webSocketServer = new websocket.server({ httpServer });

/** Upon new WebSocket request, accept and start being a signaling server. */
const _onRequest = (request) => {
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
};

webSocketServer.on("request", _onRequest);

/** Starts the server. */
const startServer = (port, hostname) => {
  httpServer.listen(port, hostname, () =>
    console.log(`Server listening on ${hostname}:${port}`)
  );
};

module.exports = {
  startServer,
};
