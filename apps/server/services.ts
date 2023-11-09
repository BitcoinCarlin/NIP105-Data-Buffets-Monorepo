
// -------------- SERVICES SETUP --------------

import { chatGPT } from "./services/chatGPT";

const services: NIP105Service[] = [
    chatGPT,
    // Enter Services Here
];

// -------------- DEFINES --------------

export interface NIP105Service {
    service: string;
    getTries?: (requestBody: any) => Promise<number> | number;
    getPrice: (requestBody: any) => Promise<number> | number;
    validate: (requestBody: any) => Promise<void> | void;
    process: (requestBody: any) => Promise<[number, any]> | [number, any]; //status, response
}

// -------------- FUNCTIONS --------------

const servicesMap: Map<string, NIP105Service> = services.reduce((map, serviceProvider) => {
    map.set(serviceProvider.service, serviceProvider);
    return map;
}, new Map<string, NIP105Service>());

// This function will simply throw an error if the service is not valid.
export async function validateService(service: string, requestBody: any): Promise<void> {
    const serviceProvider = servicesMap.get(service);

    if(!serviceProvider) {
        throw new Error("Invalid service");
    }

    return await serviceProvider.validate(requestBody);
}

export async function getTriesForService(service: string, requestBody: any, defaultTries: number = 3): Promise<number> {
    const serviceProvider = servicesMap.get(service);

    if(!serviceProvider) {
        throw new Error("Invalid service");
    }

    if(!serviceProvider.getTries) {
        return defaultTries;
    }

    return await serviceProvider.getTries(requestBody);
}

export async function getPriceForService(service: string, requestBody: any): Promise<number> {
    const serviceProvider = servicesMap.get(service);

    if(!serviceProvider) {
        throw new Error("Invalid service");
    }

    return await serviceProvider.getPrice(requestBody);
}



export async function processService(service: string, requestBody: any): Promise<[number, any]> {
    const serviceProvider = servicesMap.get(service);

    if(!serviceProvider) {
        throw new Error("Invalid service");
    }

    try {
        return await serviceProvider.process(requestBody);
    } catch (error) {
        const message = `Error processing service: ${error}`;
        return [500, {message}];
    }
}