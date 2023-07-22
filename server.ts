import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import * as log from "https://deno.land/std@0.195.0/log/mod.ts";
import { generate } from "npm:random-words@2.0";
import { RequestOfferResponse } from "./RequestOfferResponse.ts";
import { RoomCodeResponse } from "./RoomCodeResponse.ts";

const activeSockets: Record<string, WebSocket> = {};
const rooms: Record<string, string> = {};

function handle(request: Request): Response {
  if (request.headers.get("upgrade") !== "websocket") {
    log.info("A client tried to send a request that wasn't a WebSocket.");
    return new Response("This server only accepts WebSocket connections.", {
      status: 501,
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);
  let clientId: string;

  socket.onopen = () => {
    clientId = `client-${makeId()}`;
    log.info(`${clientId} has connected.`);
    activeSockets[clientId] = socket;
  };

  socket.onclose = () => {
    log.info(`${clientId} has disconnected.`);
    delete activeSockets[clientId];
    delete rooms[clientId];
  };

  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    log.info(`Incoming message from ${clientId} with type: ${message.type}`);
    log.debug(`Message: ${message}`);

    if (
      message.type === "candidate" || message.type === "offer" ||
      message.type === "answer"
    ) {
      log.debug(`Forwarding message to ${message.id}`);
      const recipient = activeSockets[message.id];
      message.id = clientId;
      recipient.send(JSON.stringify(message));
    } else if (message.type === "host") {
      const roomCode = `room-${makeId()}`;
      rooms[clientId] = roomCode;
      log.info(`${clientId} has made a new room: ${roomCode}`);
      socket.send(new RoomCodeResponse(roomCode).toJson());
    } else if (message.type === "join") {
      log.info(`${clientId} wants to join room: ${message.roomCode}`);
      for (const activeSocketId of Object.keys(activeSockets)) {
        if (rooms[activeSocketId] === message.roomCode) {
          log.debug(
            `Asking ${activeSocketId} to send an offer to ${clientId}.`,
          );
          activeSockets[activeSocketId].send(
            new RequestOfferResponse(clientId).toJson(),
          );
        }
      }
      rooms[clientId] = message.roomCode;
    }
  };

  return response;
}

const usedIds = new Set();
/** Generates a new random ID. Doesn't reuse already used IDs. */
function makeId(): string {
  while (true) {
    const candidate = generate({ minLength: 3, maxLength: 3, exactly: 2 }).join(
      "",
    );
    if (!(candidate in usedIds)) {
      return candidate;
    }
  }
}

serve(handle, { port: 8000 });
