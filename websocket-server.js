/** A WebSocket-based signaling server. */

const websocket = require("websocket");
const { httpServer } = require("./http-server");

/** Contains all clients connected to the server. */
const activeConnections = {};

/** The WebSocket Server. */
const webSocketServer = new websocket.server({ httpServer });

/** When a message comes in, forward it along. */
const _onMessage = (data, clientId) => {
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
};

/** When a client disconnects, delete them from active connections. */
const _onClose = (clientId) => {
  delete activeConnections[clientId];
  console.error(`Client ${clientId} disconnected`);
};

/** When there's a new WebSocket request, accept it and start communicating. */
const _onRequest = (request) => {
  const clientId = request.resourceURL.path.split("/")[1];
  const connection = request.accept(null, request.origin);
  console.log(`New client has connected: ${clientId}`);

  connection.on("message", (data) => _onMessage(data, clientId));
  connection.on("close", () => _onClose(clientId));

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
