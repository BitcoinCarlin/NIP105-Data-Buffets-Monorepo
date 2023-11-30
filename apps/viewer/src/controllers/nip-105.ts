import { Event as NostrEvent } from "nostr-tools";

enum OfferingStatus {
  up = "UP",
  down = "DOWN",
  closed = "CLOSED",
}

enum CostUnits {
  mins = "MINS",
  secs = "SECS",
  tokens = "TOKENS",
}

export interface OfferingContent {
  /** The POST endpoint you call to pay/fetch */
  endpoint: string;
  /** UP/DOWN/CLOSED */
  status: OfferingStatus;
  /** The fixed per call cost in mSats (b in y = mx + b) */
  fixedCost: number;
  /** The variable cost based on request's units (i.e. 2000msats per min) */
  variableCost: number;
  /** The units that denominate the variable cost */
  costUnits: number;
  /** Recommended - JSON schema for the POST body of the endpoint */
  schema?: Object;
  /** Recommended - JSON schema for the response of the call */
  outputSchema?: Object;
  /** Optional - Description for the end user */
  description?: string;
}

export function getOffering(note: NostrEvent<31402>): OfferingContent | null {
  try {
    const content = JSON.parse(note.content) as OfferingContent;

    if (!content || !content.endpoint) {
      return null;
    }

    if (
      content.endpoint.includes("127.0.0.1") ||
      content.endpoint.includes("localhost")
    ) {
      return null;
    }

    return content;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function getTagValue(note: NostrEvent<31402>, tagName: string): string | null {

    const tagArray = note.tags.find(tag => tag[0] === tagName);
    if(!tagArray) return null;
    return tagArray[1];
  }