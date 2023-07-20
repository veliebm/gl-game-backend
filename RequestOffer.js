/** Message to request an offer from a client. */

class RequestOffer {
  type = "requestOffer";
  id;

  constructor(id) {
    this.id = id;
  }

  toJson() {
    return JSON.stringify(this);
  }
}

module.exports = {
  RequestOffer: RequestOffer,
};
