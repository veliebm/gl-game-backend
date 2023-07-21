import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import { RequestOfferResponse } from "./RequestOfferResponse.ts";
import { ExceptionResponse } from "./ExceptionResponse.ts";
import { RoomCodeResponse } from "./RoomCodeResponse.ts";

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
    activeSockets[clientId] = socket;
  };

  socket.onclose = () => {
    console.log(`Client ${clientId} has disconnected.`);
    delete activeSockets[clientId];
  };

  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    console.log(`Incoming message from ${clientId} with type: ${message.type}`);

    if (
      message.type === "candidate" || message.type === "offer" ||
      message.type === "answer"
    ) {
      const recipient = activeSockets[message.id];
      message.id = clientId;
      recipient.send(JSON.stringify(message));
    } else if (message.type === "host") {
      socket.send(new RoomCodeResponse("thisIsYourRoomCode").toJson());
    } else if (message.type === "join") {
      for (const activeSocketId of Object.keys(activeSockets)) {
        console.log(
          `Asking ${activeSocketId} to send an offer to ${clientId}.`,
        );
        activeSockets[activeSocketId].send(
          new RequestOfferResponse(clientId).toJson(),
        );
      }
    }
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
