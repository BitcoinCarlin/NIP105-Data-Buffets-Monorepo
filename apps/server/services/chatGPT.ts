import { NIP105Service } from "../services";

const service = "chatGPT";

function getPrice(requestBody: any): number {
    return 1000;
}

function validate(requestBody: any): void {
    return;
}

function process(requestBody: any): [number, any] {
    return [202, {message: "Hello World"}];
}

export const chatGPT: NIP105Service  = {
    service,
    getPrice,
    validate,
    process,
}