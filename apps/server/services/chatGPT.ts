import { Event as NostrEvent} from 'nostr-tools';
import { NIP105ProcessInput, NIP105Service } from "../services";
import { OfferingStatus, createUnsignedServiceEvent } from 'nip105';

const API_KEY = (Bun.env.CHAT_GPT_API_KEY) as string;
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const SERVICE = "GPT";

function createServiceEvent(serverEndpoint: string): NostrEvent {

    return createUnsignedServiceEvent(
        {
            endpoint: serverEndpoint + "/" + SERVICE,
            status: OfferingStatus.up,
            fixedCost: 1000,
            variableCost: 0,
            costUnits: 0
        },
        ENDPOINT
    )
}

function getPrice(requestBody: any): number {

    return 1000;
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