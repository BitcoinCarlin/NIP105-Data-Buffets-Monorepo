import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Database from "bun:sqlite";
import { SimplePool } from "nostr-tools";
import {
  Action,
  Status,
  serverLog,
} from "utils";
import {
  deleteJobTable,
  setupJobTable,
} from "./database";
import {
  NIP105Service,
  getAllServiceEvents,
} from "./services";
import { sleep } from "bun";
import { getPrivateKey, postServices } from "./nostr";
import { checkServicePayment, getServiceInvoice, getServiceResult } from "./server";

// ------------------- SERVICE SETUP -------------------
import { chatGPT } from "./services/chatGPT";

const SERVICES: NIP105Service[] = [
  chatGPT,
  // Enter Services Here
];

const SERVICE_MAP: Map<string, NIP105Service> = SERVICES.reduce((map, serviceProvider) => {
  map.set(serviceProvider.service, serviceProvider);
  return map;
}, new Map<string, NIP105Service>());

// ------------------- DATABASE SETUP ------------------

const debug = Boolean(Bun.env.DEBUG);
const dbFilename = debug ? Bun.env.DEV_DB_FILENAME : Bun.env.DB_FILENAME;

const DB = new Database(dbFilename, { create: true });
const JOB_TABLE = Bun.env.DB_JOB_TABLE as string;

if (debug) {
  serverLog(Action.SERVER, Status.ERROR, "Starting from a clean slate");
  deleteJobTable(DB, JOB_TABLE); //TODO take out, for debugging
}
setupJobTable(DB, JOB_TABLE);

// -------------------- SERVER SETUP --------------------

const APP = express();
const SERVER_PORT = Number(Bun.env.SERVER_PORT);
const SERVER_URL = `${Bun.env.SERVER_URL as string}`;
const SERVER_LUD16 = `${Bun.env.SERVER_LUD16 as string}`;

APP.use(cors());
APP.use(bodyParser.json());

// --------------------- ENDPOINTS ---------------------

APP.post("/:service", async (request, response) => {
  getServiceInvoice(request, response, SERVICE_MAP, DB, JOB_TABLE, SERVER_LUD16, SERVER_URL);
});

APP.get("/:service/:payment_hash/get_result", async (request, response) => {
  getServiceResult(request, response, SERVICE_MAP, DB, JOB_TABLE);
});

APP.get("/:service/:payment_hash/check_payment", async (request, response) => {
  checkServicePayment(request, response, DB, JOB_TABLE);
});

// --------------------- SERVER LOOP --------------------------

APP.listen(SERVER_PORT, () => {
  serverLog(Action.SERVER, Status.INFO, "Welcome to NIP-105: Data Buffet!");
  serverLog(Action.SERVER, Status.INFO, `Listening on port ${SERVER_PORT}...`);
});

// --------------------- NOSTR SETUP --------------------------
//TODO UPDATE Periodically

const RELAYS = [
  'wss://dev.nostrplayground.com'
];
const POOL = new SimplePool()
const PRIVATE_KEY_FILEPATH = (Bun.env.PRIVATE_KEY_FILEPATH) as string;
const PRIVATE_KEY = await getPrivateKey(PRIVATE_KEY_FILEPATH);

// --------------------- NOSTR LOOP --------------------------
async function updateServices() {
  while(true) {
    try {
      const allEvents = await getAllServiceEvents(SERVICES, SERVER_URL);
      await postServices(POOL, PRIVATE_KEY, RELAYS, allEvents);
      serverLog(Action.SERVER, Status.INFO, `Posted ${allEvents.length} services to ${RELAYS.length} Nostr relay(s)`);
      await sleep(1000 * 60 * 10); // Every 10 minutes
    } catch (error) {
      serverLog(Action.SERVER, Status.ERROR, `Error posting to Nostr: ${error}`);
    }

  }
}

updateServices()