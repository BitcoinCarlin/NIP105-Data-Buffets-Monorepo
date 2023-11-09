import { Invoice } from "utils";

export function setNIP105SuccessAction(invoice: Invoice, serverUrl: string, service: string, message: string): Invoice {
    return {
        ...invoice,
        paymentRequest: {
            ...invoice.paymentRequest,
            successAction: {
                tag: "url",
                message: "Paying for service",
                url: `${serverUrl}/${service}/${invoice.paymentHash}/get_result`
            }
        }
    };
  }