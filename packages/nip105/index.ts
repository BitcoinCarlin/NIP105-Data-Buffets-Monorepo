import { Event as NostrEvent } from "nostr-tools";
import { Invoice } from "utils";

export function setNIP105SuccessAction(
  invoice: Invoice,
  serverUrl: string,
  service: string,
  message?: string
): Invoice {
  return {
    ...invoice,
    paymentRequest: {
      ...invoice.paymentRequest,
      successAction: {
        tag: "url",
        message: message ?? "Paying for service",
        url: `${serverUrl}/${service}/${invoice.paymentHash}/get_result`,
      },
    },
  };
}

export enum OfferingStatus {
    up = 'UP',
    down = 'DOWN',
    closed = 'CLOSED'
  }

  export enum CostUnits {
    mins = 'MINS',
    secs = 'SECS',
    tokens = 'TOKENS',
  }

export interface OfferingContent {
    /** The POST endpoint you call to pay/fetch */
    endpoint: string,
    /** UP/DOWN/CLOSED */         
    status: OfferingStatus,   
    /** The fixed per call cost in mSats (b in y = mx + b) */ 
    fixedCost: number,
    /** The variable cost based on request's units (i.e. 2000msats per min) */
    variableCost: number,
    /** The units that denominate the variable cost */
    costUnits: number,
    /** Recommended - JSON schema for the POST body of the endpoint */
    schema?: Object,
    /** Recommended - JSON schema for the response of the call */
    outputSchema?: Object,
    /** Optional - Description for the end user */
    description?: string
  }

export function createUnsignedServiceEvent(
    content: OfferingContent,
    service: string
): NostrEvent{
    return {
        kind: 31402,
        content: JSON.stringify(content),
        created_at: Date.now(),
        tags: [
            ['s', service],
            ['d', service]
        ],
        pubkey: '',
        id: '',
        sig: ''
    } ;
}

export function getTagValue(note: NostrEvent<31402>, tagName: string): string | null {

  const tagArray = note.tags.find(tag => tag[0] === tagName);
  if(!tagArray) return null;
  return tagArray[1];
}