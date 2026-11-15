
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function viewDatabase() {
    const db = await open({
        filename: "./users.db",
        driver: sqlite3.Database
    });

    const users = await db.all(
        "SELECT * FROM users"
    );

    console.table(users);

    await db.close();
}

viewDatabase();
