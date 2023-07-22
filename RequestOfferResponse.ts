/** Message to request an offer from a client. */
export class RequestOfferResponse {
  /** The Type of this object. */
  type = "requestOffer";
  /** The Client ID to send an offer to. */
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
