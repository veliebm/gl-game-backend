/** A WebSocket-based signaling server. */

const websocket = require("websocket");
const { httpServer } = require("./http-server");
const { ExceptionMessage } = require("./ExternalException");

/** Contains all clients connected to the server. */
const activeConnections = {};

/** The WebSocket Server. */
const webSocketServer = new websocket.server({ httpServer });

/** When a message comes in, forward it along. */
const _onMessage = (data, clientId) => {
  if (data.type !== "utf8") {
    activeConnections[clientId].send(
      ExceptionMessage(
        400,
        `BAD REQUEST: You sent data with bad encoding. Its encoding: ${data.type}`,
        `Client ${clientId} tried sending message with invalid encoding: ${data.type}`
      ).toJson()
    );
    return;
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
  _onMessage,
  _onClose,
  _onRequest,
};
