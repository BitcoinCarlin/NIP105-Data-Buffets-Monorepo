import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import Database from "bun:sqlite"
import { Action, Status, serverLog } from "utils"
import { setupJobTable} from "./database"

// ------------------- DATABASE SETUP ------------------

const DB = new Database(Bun.env.DB_FILENAME, { create: true })
const JOB_TABLE = Bun.env.DB_JOB_TABLE as string

setupJobTable(DB, JOB_TABLE) // Setup the table immediately after its definition

// -------------------- SERVER SETUP --------------------

const APP = express()
const SERVER_PORT = Number(Bun.env.SERVER_PORT)
const SERVER_URL = `${Bun.env.SERVER_URL as string}`

APP.use(cors())
APP.use(bodyParser.json())

// --------------------- ENDPOINTS ---------------------

APP.post("/:service", async (request, response) => {
    response.status(200).send({ message: "Service Endpoint Working" })
})

APP.get("/:service/:payment_hash/get_result", async (request, response) => {
    response.status(200).send({ message: "Get Result Working" })
})

APP.get("/:service/:payment_hash/check_payment", async (request, response) => {
    response.status(200).send({ message: "Check Payment Working" })
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