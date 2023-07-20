/** A WebSocket-based signaling server. */

const websocket = require("websocket");
const crypto = require("crypto");
const { httpServer } = require("./http-server");
const { ClientExceptionMessage } = require("./ClientExceptionMessage");
const { RequestOfferMessage } = require("./RequestOfferMessage");

const activeConnections = {};
const webSocketServer = new websocket.server({ httpServer });

/** When a message comes in, forward it along. */
const _onMessage = (data, clientId) => {
  if (data.type !== "utf8") {
    activeConnections[clientId].send(
      new ClientExceptionMessage(
        400,
        `BAD REQUEST: You sent data with bad encoding. Its encoding: ${data.type}`,
        `Client ${clientId} tried sending message with invalid encoding: ${data.type}`
      ).toJson()
    );
    return;
  }

  console.log(`Incoming message from Client ${clientId}: ${data.utf8Data}`);
  const message = JSON.parse(data.utf8Data);

  if (!message.hasOwnProperty("id")) {
    activeConnections[clientId].send(
      new ClientExceptionMessage(
        400,
        `BAD REQUEST: You sent a message with no ID. Message: ${message}`,
        `Client ${clientId} tried sending message with no ID: ${message}`
      ).toJson()
    );
    return;
  }

  const recipientId = message.id;

  if (!activeConnections.hasOwnProperty(recipientId)) {
    activeConnections[clientId].send(
      new ClientExceptionMessage(
        400,
        `BAD REQUEST: ID doesn't exist. ID: ${recipientId}`,
        `Client ${clientId} tried sending a nonexistent ID: ${recipientId}`
      ).toJson()
    );
    return;
  }

  const recipient = activeConnections[recipientId];
  message.id = clientId;
  const outgoingData = JSON.stringify(message);
  console.log(`Sending to Client ${recipientId}: ${outgoingData}`);
  recipient.send(outgoingData);
};

/** When a client disconnects, delete them from active connections. */
const _onClose = (clientId) => {
  delete activeConnections[clientId];
  console.error(`Client ${clientId} disconnected`);
};

/** When there's a new WebSocket request, accept it and start communicating. */
const _onRequest = (request) => {
  const clientId = _makeNewId();
  const connection = request.accept(null, request.origin);

  console.log(`New client has connected: ${clientId}`);

  connection.on("message", (data) => _onMessage(data, clientId));
  connection.on("close", () => _onClose(clientId));

  for (otherId in activeConnections) {
    console.log(`Requesting offer for ${otherId} from ${clientId}`);
    connection.send(new RequestOfferMessage(otherId).toJson());
  }

  activeConnections[clientId] = connection;
};

webSocketServer.on("request", _onRequest);

/** Returns a new ID that's not already in use. */
const _makeNewId = () => {
  while (true) {
    const clientId = crypto.randomBytes(4).toString("hex");
    if (!activeConnections.hasOwnProperty(clientId)) {
      return clientId;
    }
  }
};

/** Starts the server. */
const startServer = (port, hostname) => {
  httpServer.listen(port, hostname, () =>
    console.log(`Server listening on ${hostname}:${port}`)
  );
};

module.exports = {
  startServer,
};
