var neo4j = require('neo4j-driver').v1;

const neo4jUser = process.env.NEO4J_USER;
const neo4jPassword = process.env.NEO4J_PASSWORD;
const neo4jEndpoint = process.env.NEO4J_ENDPOINT;

const INITIAL_BALANCE = 7000;

function getNeo4jDriver() {
    console.log("Connecting to neo4j");
    var driver = neo4j.driver(neo4jEndpoint, neo4j.auth.basic(neo4jUser, neo4jPassword));
    console.log("Created neo4j driver.");
    return driver;
}

/********************************************************************** */
// returns true/false whether account exists
/********************************************************************** */
module.exports.userExists = async (username) => {
    var driver = getNeo4jDriver();
    const session = driver.session();
    const result = await session.run("Match (n:User) WHERE n.name='" + username + "' RETURN n.name");
    var isExists = (result.records.length >= 1);
    session.close();
    driver.close();
    console.log("userExists for " + username + " result:" + isExists);
    return isExists; // true for success
}

/********************************************************************** */
// new user - new neo4j node
/********************************************************************** */
async function createUser(session, username) {
    const result = await session.run("CREATE (n:User {name:'" + username + "', balance: " + INITIAL_BALANCE + " }) RETURN n");

    return result;
}

module.exports.get_balance_for_user = async (username) => {
    var driver = getNeo4jDriver();
    const session = driver.session();
    const result = await session.run("Match (n:User) WHERE n.name='" + username + "' RETURN n");
    session.close();
    driver.close();

    if (result.records.length == 0) {
        return null;
    }

    record = result.records[0];
    // get value and transform from neo4j-style-numbers
    var curBalance = record._fields[0].properties.balance;
    if ('low' in curBalance) { // if Neo4j long object, take only number.
        curBalance = curBalance.low;
    }
    console.log("getBalance result:" + curBalance);
    return Number(curBalance);
}

module.exports.ensure_account_exists = async (username) => {
    var driver = getNeo4jDriver();
    const session = driver.session();
    var result = null;
    if (!await this.userExists(username)) {
        result = await createUser(session, username);
    }
    else {
        result = "OK"; // not null - OK - successful.
    }

    session.close();
    driver.close();

    return result;
}

module.exports.getAllUsers = async (username) => {
    var driver = getNeo4jDriver();
    const session = driver.session();
    const result = await session.run("MATCH (n:User) RETURN n.name");
    session.close();
    driver.close();
    return result.records;
}

module.exports.setBalanceByUser = async (username, balance) => {
    var driver = getNeo4jDriver();
    const session = driver.session();
    const result = await session.run(`MATCH (n { name: '${username}' }) SET n.balance = ${balance} RETURN n.name,n.balance`);
    session.close();
    driver.close();
    return true;
}

module.exports.setRelationships = async (fromUser, toUser, balance) => {
    var driver = getNeo4jDriver();
    const session = driver.session();
    var timestamp = date.now();
    await session.run(`MERGE (id:UniqueId{name:'Event'})
    ON CREATE SET id.count = 1
    ON MATCH SET id.count = id.count + 1
    WITH id.count AS uid
    MERGE (dummyEvent:Event{id:0})
    WITH uid
    MATCH (lastevent:Event) where NOT (lastevent)-[:next]->()
    CREATE (newevent:Event { timestamp: '${timestamp}', sum: ${balance}, id:uid})
    create (lastevent)-[:next]->(newevent)
    with newevent
    MATCH (from:User { name: '${fromUser}' })
    MATCH (to:User { name: '${toUser}' })
    create (from)-[:from]->(newevent)<-[:to]-(to)
    `);
    session.close();
    driver.close();
    return true;
};

/*
MERGE (id:UniqueId{name:'Event'})
ON CREATE SET id.count = 1
ON MATCH SET id.count = id.count + 1
WITH id.count AS uid
// create Person node
MERGE (dummyEvent:Event{id:0})
WITH uid
MATCH (lastevent:Event) where NOT (lastevent)-[:next]->()
CREATE (newevent:Event { sum: '20', id:uid})
create (lastevent)-[:next]->(newevent)
with newevent
MATCH (from:User { name: 'FleishD-at-gmail.com' })
MATCH (to:User { name: 'badulina-at-gmail.com' })
create (from)-[:from]->(newevent)<-[:to]-(to)
*/