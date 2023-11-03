import Database from "bun:sqlite";

// ---------------- SECURITY ------------------
const JOB_TABLE = Bun.env.DB_JOB_TABLE as string
const PR_TABLE = Bun.env.DB_PR_TABLE as string

function checkIfIsTableOk(table: string) {
  if (table !== JOB_TABLE && table !== PR_TABLE) {
    throw new Error("Bad table")
  }
}

// ---------------- TABLE SETUP ------------------

//TODO Table Setups
export function setupJobTable(db: Database, table: string) {
    checkIfIsTableOk(table)
  
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${table} (
        noteId TEXT PRIMARY KEY,
        price INTEGER,
        lud16 TEXT,
        secret TEXT,
        timestamp INTEGER
      );
    `
  
    // db.query(createTableQuery).run()
  }
  
  export function setupPRTable(db: Database, table: string) {
    checkIfIsTableOk(table)
  
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${table} (
        paymentHash TEXT PRIMARY KEY,
        noteId TEXT,
        pr TEXT,
        verify TEXT,
        status TEXT,
        paymentStatus TEXT,
        successAction TEXT,
        routes TEXT,
        timestamp INTEGER
      );
    `
  
    // db.query(createTableQuery).run()
  }