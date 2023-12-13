import {
  Action,
  Invoice,
  Status,
  checkPaid,
  getInvoice,
  serverLog,
} from "utils";
import {
  NIP105Service,
  getPriceForService,
  getTriesForService,
  processService,
  validateService,
} from "./services";
import { setNIP105SuccessAction } from "nip105";
import {
  JobState,
  createJobEntry,
  getJobEntry,
  markComplete,
  markError,
  markPaid,
  setResponse,
} from "./database";
import Database from "bun:sqlite";

export async function getServiceInvoice(
  request,
  response,
  servicesMap: Map<string, NIP105Service>,
  database: Database,
  table: string,
  lud16: string,
  serverUrl: string
) {
  try {
    serverLog(Action.GET_INVOICE, Status.INFO, "Fetching request for invoice");

    const service = request.params.service;
    const requestBody = request.body;

    await validateService(servicesMap, service, requestBody);
    const cost = await getPriceForService(servicesMap, service, requestBody);
    const tries = await getTriesForService(servicesMap, service, requestBody);
    const rawInvoice = await getInvoice(lud16, cost);
    const invoice = setNIP105SuccessAction(
      rawInvoice,
      serverUrl,
      service,
      "Paying for service"
    );

    createJobEntry(database, table, service, cost, tries, invoice, requestBody);

    response.status(402).send(invoice);
  } catch (error) {
    serverLog(
      Action.GET_INVOICE,
      Status.ERROR,
      `Error requesting invoice: ${error}`
    );
    response
      .status(500)
      .send({ message: `Error requesting invoice: ${error}` });
  }
}

export async function getServiceResult(
  request,
  response,
  servicesMap: Map<string, NIP105Service>,
  database: Database,
  table: string
) {
  try {
    serverLog(Action.GET_RESULT, Status.INFO, "Fetching results");

    const jobEntry = getJobEntry(database, table, request.params.payment_hash);

    switch (jobEntry.state) {
      case JobState.ERROR:
        if (jobEntry.tries) break;

        response.status(500).send({ message: jobEntry.message });
        return;
      case JobState.COMPLETED:
        response.status(200).send(JSON.parse(jobEntry.responseJSON));
        return;
      case JobState.UNPAID:
        const paymentRequest = (JSON.parse(jobEntry.invoiceJSON) as Invoice)
          .paymentRequest;
        const verifyPaymentRequest = await checkPaid(paymentRequest);
        const isPaid = verifyPaymentRequest.settled;

        if (!isPaid) {
          response.status(402).send({ message: "Payment not received" });
          return;
        } else {
          markPaid(database, table, request.params.payment_hash);
        }
        break;
      case JobState.FETCHING:
        break;
    }

    const [status, data] = await processService(
      servicesMap,
      jobEntry.service,
      JSON.parse(jobEntry.requestJSON),
      jobEntry.responseJSON ? JSON.parse(jobEntry.responseJSON) : null
    );

    switch (status) {
      case 200:
        markComplete(
          database,
          table,
          request.params.payment_hash,
          data
        );
        break;
      case 500:
        markError(
          database,
          table,
          request.params.payment_hash,
          data
        );
        break;
      case 202:
        setResponse(
          database,
          table,
          request.params.payment_hash,
          data
        );
        break; // Still working
    }

    response.status(status).send(data);
  } catch (error) {
    response.status(500).send({ message: `Error checking result: ${error}` });
  }
}

export async function checkServicePayment(
  request,
  response,
  database: Database,
  table: string
) {
  try {
    serverLog(Action.CHECK_PAYMENT, Status.INFO, "Checking if Paid");

    const jobEntry = getJobEntry(database, table, request.params.payment_hash);

    if (jobEntry.paid) {
      response.status(200).send({ settled: true });
      return;
    }

    const invoice = JSON.parse(jobEntry.invoiceJSON) as Invoice;
    const verifyPaymentRequest = await checkPaid(invoice.paymentRequest);
    const isPaid = verifyPaymentRequest.settled;

    if (isPaid) {
      markPaid(database, table, request.params.payment_hash);
    }

    response.status(200).send({ settled: isPaid });
  } catch (error) {
    response.status(500).send({ message: `Error checking payment: ${error}` });
  }
}
