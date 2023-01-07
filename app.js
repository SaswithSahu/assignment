const express = require("express");
const path = require("path");
let dateFun = require("date-fns");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
let db = null;

const dbpath = path.join(__dirname, "todoApplication.db");

const InitiallizeAndstartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (e) {
    console.log(`database error ${e}`);
    process.exit(1);
  }
};

InitiallizeAndstartServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

function getCond1(status) {
  if (
    status === "TO DO" ||
    status === "DONE" ||
    status === "IN PROGRESS" ||
    status === ""
  )
    return true;
  else return false;
}

function getCond2(priority) {
  if (
    priority === "HIGH" ||
    priority === "LOW" ||
    priority === "MEDIUM" ||
    priority === ""
  )
    return true;
  else return false;
}
function getCond3(category) {
  if (
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING" ||
    category === ""
  )
    return true;
  else return false;
}

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  const cond1 = getCond1(status);
  const cond2 = getCond2(priority);
  const cond3 = getCond3(category);
  if (cond1 && cond2 && cond3) {
    const getQuery = `
    SELECT * 
    FROM 
    todo
    WHERE
     status LIKE "%${status}%" AND
     priority LIKE "%${priority}%"AND
     category LIKE "%${category}%"AND
     todo LIKE "%${search_q}%"`;

    const dbResponse = await db.all(getQuery);
    response.send(
      dbResponse.map((eachPlayer) =>
        convertDbObjectToResponseObject(eachPlayer)
      )
    );
  } else {
    if (cond1 === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (cond2 === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
    SELECT * 
    FROM 
    todo
    WHERE
     id = ${todoId}`;
  const dbResponse = await db.get(getQuery);
  response.send(convertDbObjectToResponseObject(dbResponse));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (dateFun.isValid(new Date(date))) {
    let d = date.split("-");
    let fdate = dateFun.format(new Date(d[0], d[1] - 1, d[2]), "yyyy-MM-dd");
    const getQuery = `
    SELECT * 
    FROM 
    todo
    WHERE
     due_date = "${fdate}"`;
    const dbResponse = await db.all(getQuery);
    response.send(
      dbResponse.map((eachPlayer) =>
        convertDbObjectToResponseObject(eachPlayer)
      )
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addQuery = `
    INSERT INTO
      todo (id,todo,priority,status)
    VALUES
      (
         ${id},
         '${todo}',
         '${priority}',
         '${status}'
      );`;
  const dbResponse = await db.run(addQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, priority, status, category, dueDate } = todoDetails;
  if (status != undefined) {
    if (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") {
      const updateQuery = `UPDATE todo 
        SET 
          status = "${status}"
        WHERE
           id = ${todoId};`;
      await db.run(updateQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (priority != undefined) {
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
      const updateQuery = `UPDATE todo 
        SET 
          priority = "${priority}"
        WHERE
           id = ${todoId};`;
      await db.run(updateQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (todo != undefined) {
    const updateQuery = `UPDATE todo 
        SET 
          todo = "${todo}"
        WHERE
           id = ${todoId};`;
    await db.run(updateQuery);
    response.send("Todo Updated");
  }
  if (category != undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updateQuery = `UPDATE todo 
        SET 
          category = "${category}"
        WHERE
           id = ${todoId};`;
      await db.run(updateQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (dueDate != undefined) {
    let res = dateFun.isValid(new Date(dueDate));
    if (res) {
      const updateQuery = `UPDATE todo 
        SET 
          due_date = "${dueDate}"
        WHERE
           id = ${todoId};`;
      await db.run(updateQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
