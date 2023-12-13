import { Event as NostrEvent} from 'nostr-tools';
import { NIP105Service } from "../services";
import { OfferingStatus, createUnsignedServiceEvent } from 'nip105';

const API_KEY = (Bun.env.SD_API_KEY) as string;
const ENDPOINT = "https://stablediffusionapi.com/api/v4/dreambooth";
const SERVICE = "SD";

function createServiceEvent(serverEndpoint: string): NostrEvent {

    return createUnsignedServiceEvent(
        {
            endpoint: serverEndpoint + "/" + SERVICE,
            status: OfferingStatus.up,
            fixedCost: 10000,
            variableCost: 0,
            costUnits: 0
        },
        ENDPOINT
    )
}

function getPrice(requestBody: any): number {

    return 10000;
}

function validate(requestBody: any): void {

    return;
}

async function handleFirstResponse(requestBody: any): Promise<[number, any]> {
    const input = {
        ...requestBody,
        key: API_KEY,
    }

    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        // redirect: 'follow'
    })

    const responseJSON = await response.json() as any;


    if(responseJSON.status !== "success") {
        return [202, responseJSON];
    }

    return [200, responseJSON];
}

async function handlePreviousResponse(requestBody: any, previousResponse: any): Promise<[number, any]> {
    const input = {
        key: API_KEY,
    }

    const response = await fetch(previousResponse.fetch_result, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        // redirect: 'follow'
    })

    const responseJSON = await response.json() as any;

    if(responseJSON.status !== "success") {
        return [202, previousResponse];
    }

    return [200, responseJSON];
}

async function process(requestBody: any, previousResponse: any): Promise<[number, any]> {

    if(previousResponse){
        return handlePreviousResponse(requestBody, previousResponse)
    }

    return handleFirstResponse(requestBody);
}

export const stableDiffusion: NIP105Service = {
    service: SERVICE,
    createServiceEvent,
    getPrice,
    validate,
    process,
}