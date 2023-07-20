/** Message to request an offer from a client. */
export class RequestOfferMessage {
  /** The Type of this object. */
  type = "requestOffer";
  /** The Client ID to send an offer to. */
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  /** Serializes this object to JSON. */
  toJson() {
    return JSON.stringify(this);
  }
}