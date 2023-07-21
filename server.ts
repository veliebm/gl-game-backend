import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { RequestOfferResponse } from "./RequestOfferResponse.ts";
import { ExceptionResponse } from "./ExceptionResponse.ts";

const activeSockets: Record<string, WebSocket> = {};

function handle(request: Request): Response {
  if (request.headers.get("upgrade") !== "websocket") {
    console.error(`A client tried to send a request that wasn't a WebSocket.`);
    return new Response("This server only accepts WebSocket connections.", {
      status: 501,
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);
  let clientId: string;

  socket.onopen = () => {
    clientId = makeNewId();
    console.log(`Client ${clientId} has connected.`);
    for (const activeSocket of Object.values(activeSockets)) {
      activeSocket.send(new RequestOfferResponse(clientId).toJson());
    }
    activeSockets[clientId] = socket;
  };

  socket.onclose = () => {
    console.log(`Client ${clientId} has disconnected.`);
    delete activeSockets[clientId];
  };

  socket.onmessage = ({ data }) => {
    console.log(`Incoming message from ${clientId}`);
    const message = JSON.parse(data);
    const recipient = activeSockets[message.id];
    message.id = clientId;
    recipient.send(JSON.stringify(message));
  };

  return response;
}

/** Returns a new ID that's not already in use. */
function makeNewId(): string {
  const length = 4;
  const allowedCharacters =
    "abcdefjhigklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (true) {
    let id = "";
    for (let i = 0; i < length; i++) {
      id +=
        allowedCharacters[Math.floor(Math.random() * allowedCharacters.length)];
    }
    if (!(id in activeSockets)) {
      return id;
    }
  }
}

serve(handle, { port: 8000 });
