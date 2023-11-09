import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import Database from "bun:sqlite"
import { Action, Invoice, Status, checkPaid, getInvoice, serverLog } from "utils"
import { setNIP105SuccessAction } from "nip105"
import { JobState, createJobEntry, getJobEntry, markComplete, markError, markPaid, setupJobTable} from "./database"
import { getPriceForService, getTriesForService, processService, validateService } from "./services"

// ------------------- DATABASE SETUP ------------------

const DB = new Database(Bun.env.DB_FILENAME, { create: true })
const JOB_TABLE = Bun.env.DB_JOB_TABLE as string

setupJobTable(DB, JOB_TABLE)

// -------------------- SERVER SETUP --------------------

const APP = express()
const SERVER_PORT = Number(Bun.env.SERVER_PORT)
const SERVER_URL = `${Bun.env.SERVER_URL as string}`
const SERVER_LUD16 = `${Bun.env.SERVER_LUD16 as string}`

APP.use(cors())
APP.use(bodyParser.json())

// --------------------- ENDPOINTS ---------------------

APP.post("/:service", async (request, response) => {
    try {

        serverLog(
            Action.GET_INVOICE,
            Status.INFO,
            "Fetching request for invoice"
        )

        const service = request.params.service;
        const requestBody = request.body;

        await validateService(service, requestBody);
        const cost = await getPriceForService(service, requestBody);
        const tries = await getTriesForService(service, requestBody);
        const rawInvoice = await getInvoice(SERVER_LUD16, cost);
        const invoice = setNIP105SuccessAction(rawInvoice, SERVER_URL, service, "Paying for service")

        createJobEntry(DB, JOB_TABLE, service, cost, tries, invoice, requestBody);

        response.status(402).send(invoice.paymentRequest);
    } catch (error) {
        response.status(500).send({ message: `Error requesting invoice: ${error}` })
    }
})

APP.get("/:service/:payment_hash/get_result", async (request, response) => {
    try {

        serverLog(
            Action.GET_RESULT,
            Status.INFO,
            "Fetching request for invoice"
        )

        const jobEntry = getJobEntry(DB, JOB_TABLE, request.params.payment_hash)


        switch (jobEntry.state) {
            case JobState.ERROR: 
                if(jobEntry.tries) break;

                response.status(500).send({ message: jobEntry.message })
                return
            case JobState.COMPLETED:
                response.status(200).send(JSON.parse(jobEntry.responseJSON))
                return
            case JobState.UNPAID:
                const paymentRequest = (JSON.parse(jobEntry.invoiceJSON) as Invoice).paymentRequest;
                const isPaid = await checkPaid(paymentRequest);
    
                if(!isPaid) {
                    response.status(402).send({ message: "Payment not received" })
                    return
                } else {
                    markPaid(DB, JOB_TABLE, request.params.payment_hash);
                }
                break;
            case JobState.FETCHING: break;
        }

        const [status, data] = await processService(jobEntry.service, JSON.parse(jobEntry.requestJSON));

        switch (status) {
            case 200:
                markComplete(DB, JOB_TABLE, request.params.payment_hash, JSON.stringify(data));
                break;
            case 500:
                markError(DB, JOB_TABLE, request.params.payment_hash, JSON.stringify(data));
                break;
            case 202: break; // Still working
        }

        response.status(status).send(data);
    } catch (error) {
        response.status(500).send({ message: `Error checking result: ${error}` })
    }
})

APP.get("/:service/:payment_hash/check_payment", async (request, response) => {
    try {

        serverLog(
            Action.CHECK_PAYMENT,
            Status.INFO,
            "Checking if Paid"
        )

        const jobEntry = getJobEntry(DB, JOB_TABLE, request.params.payment_hash)

        if(jobEntry.paid) {
            response.status(200).send({ message: "Payment received" })
            return
        }

        const paymentRequest = (JSON.parse(jobEntry.invoiceJSON) as Invoice).paymentRequest;
        const isPaid = await checkPaid(paymentRequest);

        if(isPaid) {
            markPaid(DB, JOB_TABLE, request.params.payment_hash);
            response.status(200).send(paymentRequest)
            return
        }

        response.status(402).send({ message: "Payment not received" })
    } catch (error) {
        response.status(500).send({ message: `Error checking payment: ${error}` })
    }
})

// --------------------- MAIN --------------------------

APP.listen(SERVER_PORT, () => {
    serverLog(
      Action.SERVER,
      Status.INFO,
      "Welcome to NIP-105: Data Buffet!"
    )
    serverLog(Action.SERVER, Status.INFO, `Listening on port ${SERVER_PORT}...`)
})