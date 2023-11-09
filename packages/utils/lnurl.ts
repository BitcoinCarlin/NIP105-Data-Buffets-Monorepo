import bolt11 from "bolt11";

export const LUD16_DOMAIN_REPLACE = "DOMAIN";
export const LUD16_USER_REPLACE = "USER";
export const LUD16_URL = `https://${LUD16_DOMAIN_REPLACE}/.well-known/lnurlp/${LUD16_USER_REPLACE}`;

export type PrePayRequestMetadataPair = [string, string];
export interface PrePayRequest {
  status: "OK" | "ERROR";
  reason: string | null; // Reason for error
  tag: string; // 'payRequest'
  commentAllowed: number; // 255
  callback: string; // "https://getalby.com/lnurlp/coachchuckff/callback",
  metadata: PrePayRequestMetadataPair[];
  minSendable: number; // 1000 msats
  maxSendable: number; // 100000000 msats
  payerData: {
    name: {
      mandatory: boolean;
    };
    email: {
      mandatory: boolean;
    };
    pubkey: {
      mandatory: boolean;
    };
  };
  nostrPubkey: string;
  allowsNostr: boolean;
}

export interface PaymentRequestSuccessAction {
  tag: "message" | "url";
  message: string;
  url: string | null;
}
export interface PaymentRequest {
  status: "OK" | "ERROR";
  reason: string | null; // Reason for error
  successAction: PaymentRequestSuccessAction;
  verify: string;
  routes: string[];
  pr: string;
}

export interface VerifyPaymentRequest {
  status: "OK";
  reason: string | null; // Reason for error
  settled: boolean;
  preimage: string | null;
  pr: string;
}

export interface Invoice {
  prePayRequest: PrePayRequest;
  paymentRequest: PaymentRequest;
  paymentHash: string;
}

export function isValidLud16(lud16: string) {
  // Regular expression to validate common email structures
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(lud16);
}

export function getLud16Url(lud16: string) {
  const isValid = isValidLud16(lud16);
  if (!isValid) {
    throw new Error(`Invalid lud16: ${lud16}`);
  }

  const parts = lud16.split("@");
  const username = parts[0];
  const domain = parts[1];
  return LUD16_URL.replace(LUD16_DOMAIN_REPLACE, domain).replace(
    LUD16_USER_REPLACE,
    username
  );
}

export async function getPaymentHash(pr: string): Promise<string> {
  const decodedPR = await bolt11.decode(pr);

  if (!decodedPR) throw new Error("Could not bolt11 parse PR");

  const paymentHashTag = decodedPR.tags.find(
    (tag) => tag.tagName === "payment_hash"
  );

  if (!paymentHashTag || !paymentHashTag.data) {
    throw new Error("Payment hash tag not found or invalid");
  }

  return paymentHashTag.data as string;
}

export async function getInvoice(
  lud16: string,
  msats: number,
  expiration: Date = new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours 
): Promise<Invoice> {
  const lud16Url = getLud16Url(lud16);

  const prePayRequestRequest = await fetch(lud16Url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  const prePayRequest = (await prePayRequestRequest.json()) as PrePayRequest;

  if (prePayRequest.status !== "OK") {
    throw new Error(`Error getting pre pay request: ${prePayRequest.reason}`);
  }

  if (msats > prePayRequest.maxSendable || msats < prePayRequest.minSendable) {
    throw new Error(
      `${msats} msats not in sendable range of ${prePayRequest.minSendable} - ${prePayRequest.maxSendable}`
    );
  }

  if(!prePayRequest.callback) {
    throw new Error(`No callback provided in pre pay request`);
  }

  const expirationTime = Math.floor(expiration.getTime() / 1000);

  const paymentRequestUrl = `${prePayRequest.callback}?amount=${msats}&expiry=${expirationTime}`;
  const paymentRequestResponse = await fetch(paymentRequestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  
  const paymentRequest = await paymentRequestResponse.json() as PaymentRequest;

  if (paymentRequest.status !== "OK") {
    throw new Error(`Error getting payment request: ${paymentRequest.reason}`);
  }

  const paymentHash = await getPaymentHash(paymentRequest.pr);

  return {
    prePayRequest,
    paymentRequest,
    paymentHash,
  };
}

export async function checkPaid(
  paymentRequest: PaymentRequest
): Promise<VerifyPaymentRequest> {
  const verifyRequest = await fetch(paymentRequest.verify);
  return (await verifyRequest.json()) as VerifyPaymentRequest;
}
