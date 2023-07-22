import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
import * as log from "https://deno.land/std@0.195.0/log/mod.ts";
import { generate } from "npm:random-words@2.0";
import { RequestOfferResponse } from "./RequestOfferResponse.ts";
import { RoomCodeResponse } from "./RoomCodeResponse.ts";
import { ExceptionResponse } from "./ExceptionResponse.ts";

// {Client ID: their socket}
const activeSockets: Record<string, WebSocket> = {};
// {Client ID: their room code}
const rooms: Record<string, string> = {};
// All IDs that have been assigned since the server started.
const usedIds: Set<string> = new Set();

/** Main function of the server. */
function handle(request: Request): Response {
  if (request.headers.get("upgrade") !== "websocket") {
    log.debug("A client sent a non-WebSocket request.");
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
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      log.error(`Invalid JSON received from ${clientId}`);
      log.debug(`The data: ${data}`);
      socket.send(
        JSON.stringify(
          new ExceptionResponse(
            400,
            `Your message is not valid JSON. Your message: ${data}`,
          ),
        ),
      );
      return;
    }
    log.info(`Incoming message from ${clientId} with type: ${message.type}`);
    log.debug(`Message: ${message}`);

    if (message.type === undefined) {
      log.error(`${clientId} sent a message with no type.`);
      log.debug(`The message: ${message}`);
      socket.send(
        JSON.stringify(
          new ExceptionResponse(
            400,
            `You sent a message with no type set. Your message: ${message}`,
          ),
        ),
      );
    } else if (
      message.type === "candidate" || message.type === "offer" ||
      message.type === "answer"
    ) {
      if (!message.id) {
        log.error(
          `${clientId} didn't include an ID when they should have`,
        );
        log.debug(`The message: ${message}`);
        socket.send(
          JSON.stringify(
            new ExceptionResponse(
              400,
              `You should have included an ID in your message, but you didn't. Your message: ${message}`,
            ),
          ),
        );
        return;
      }
      const recipient = activeSockets[message.id];
      if (!recipient) {
        log.error(
          `${clientId} tried to send a message to a recipient that doesn't exist`,
        );
        log.debug(`The message: ${message}`);
        socket.send(
          JSON.stringify(
            new ExceptionResponse(
              400,
              `You tried to send a message to an ID that doesn't exist. The ID: ${message}`,
            ),
          ),
        );
        return;
      }
      log.debug(`Forwarding message to ${message.id}`);
      message.id = clientId;
      recipient.send(JSON.stringify(message));
    } else if (message.type === "host") {
      const roomCode = `room-${makeId()}`;
      if (rooms[clientId] !== undefined) {
        log.error(
          `${clientId} tried to make a new room even though they're already in one.`,
        );
        socket.send(
          JSON.stringify(
            new ExceptionResponse(
              400,
              `You tried to make a new room even though you're already in one. You're in: ${
                rooms[clientId]
              }`,
            ),
          ),
        );
        return;
      }
      rooms[clientId] = roomCode;
      log.info(`${clientId} has made a new room: ${roomCode}`);
      socket.send(JSON.stringify(new RoomCodeResponse(roomCode)));
    } else if (message.type === "join") {
      if (message.roomCode === undefined) {
        log.error(
          `${clientId} tried to join a room without providing a room code`,
        );
        socket.send(
          JSON.stringify(
            new ExceptionResponse(
              400,
              `You tried to join a room without providing a room code. Your message: ${message}`,
            ),
          ),
        );
        return;
      }
      log.info(`${clientId} wants to join room: ${message.roomCode}`);
      for (const activeSocketId of Object.keys(activeSockets)) {
        if (rooms[activeSocketId] === message.roomCode) {
          log.debug(
            `Asking ${activeSocketId} to send an offer to ${clientId}.`,
          );
          activeSockets[activeSocketId].send(
            JSON.stringify(new RequestOfferResponse(clientId)),
          );
        }
      }
      rooms[clientId] = message.roomCode;
    } else {
      log.error(
        `${clientId} sent a message with an invalid type: The type: ${message.type}`,
      );
      log.debug(`The message: ${message}`);
      socket.send(
        JSON.stringify(
          new ExceptionResponse(
            400,
            `You sent a message with an invalid type. The type: ${message.type}`,
          ),
        ),
      );
    }
  };

  return response;
}

/** Generates a new random ID. Doesn't reuse already used IDs. */
function makeId(): string {
  function toPascalCase(word: string): string {
    if (!word) {
      return word;
    }
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
  }

  while (true) {
    const candidate = generate({ minLength: 3, maxLength: 3, exactly: 2 })
      .flatMap((word) => toPascalCase(word)).join(
        "",
      );
    if (!(usedIds.has(candidate))) {
      usedIds.add(candidate);
      return candidate;
    }
  }
}

serve(handle, { port: 8000 });
