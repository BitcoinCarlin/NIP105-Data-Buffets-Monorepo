import { Event as NostrEvent} from 'nostr-tools';
import { NIP105ProcessInput, NIP105Service } from "../services";
import { OfferingStatus, createUnsignedServiceEvent } from 'nip105';
import { getBitcoinPrice, getPrice_msats } from 'utils/bitcoin-price';

const API_KEY = (Bun.env.CHAT_GPT_API_KEY) as string;
const GPT_USD_PRICE_MILLICENTS = (Bun.env.GPT_USD_PRICE_MILLICENTS) as number;
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const SERVICE = "GPT";
var currentServicePrice = 10000;

async function createServiceEvent(serverEndpoint: string): NostrEvent {
    const btcPrice = await getBitcoinPrice();
    const price = await getPrice_msats(GPT_USD_PRICE_MILLICENTS,btcPrice);
    currentServicePrice = price;
    return createUnsignedServiceEvent(
        {
            endpoint: serverEndpoint + "/" + SERVICE,
            status: OfferingStatus.up,
            fixedCost: price,
            variableCost: 0,
            costUnits: 0
        },
        ENDPOINT
    )
}

function getPrice(requestBody: any): number {

    return currentServicePrice;
}

function validate(requestBody: any): void {

    return;
}

async function process(input: NIP105ProcessInput): Promise<[number, any]> {
    const {requestBody} = input;

    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestBody)
    })

    return [200, await response.json()];
}

export const chatGPT: NIP105Service = {
    service: SERVICE,
    createServiceEvent,
    getPrice,
    validate,
    process,
}