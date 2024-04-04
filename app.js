const express = require('express')
const app = express()
app.use(express.json())
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http:/localhost:3000/')
    })
  } catch (e) {
    console.log(e.message)
  }
}

initializeDBAndServer()

const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (!categoryIsInArray) {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
    request.category = category
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (!priorityIsInArray) {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
    request.priority = priority
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (!statusIsInArray) {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
    request.status = status
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formattedDate = format(new Date(date), 'yyyy-MM-dd')
      const result = toDate(new Date(formattedDate))
      const isValidDate = await isValid(result)
      if (!isValidDate) {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
      request.date = formattedDate
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q
  next()
}

const checkRequestsBody = (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (!categoryIsInArray) {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
    request.category = category
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (!priorityIsInArray) {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
    request.priority = priority
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (!statusIsInArray) {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
    request.status = status
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const result = toDate(new Date(formattedDate))
      const isValidDate = isValid(result)
      if (!isValidDate) {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
      request.dueDate = formattedDate
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.id = id
  request.todoId = todoId
  request.todo = todo

  next()
}

// Get Todos API-1
app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {status = '', search_q = '', priority = '', category = ''} = request
  const getTodosQuery = `SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%'
            AND priority LIKE '%${priority}%'
            AND status LIKE '%${status}%'
            AND category LIKE '%${category}%';`

  const todosArray = await db.all(getTodosQuery)
  response.send(todosArray)
})

// GET Todo API-2
app.get('/todos/:todoId', checkRequestsQueries, async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            id = ${todoId};`

  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

// GET Agenda API-3
app.get('/agenda/', checkRequestsQueries, async (request, response) => {
  const {date} = request
  const selectDueDateQuery = `SELECT
            id,
            todo,
            priority,
            status,
            category,
            due_date AS dueDate
        FROM
            todo
        WHERE
            due_date = '${date}'`

  const todosArray = await db.all(selectDueDateQuery)
  if (!todosArray.length) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todosArray)
  }
})

// Add Todo API-4
app.post('/todos/', checkRequestsBody, async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const addTodoQuery = `INSERT INTO
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}')`

  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

// Update Todo API-5
app.put('/todos/:todoId/', checkRequestsBody, async (request, response) => {
  const {todoId} = request.params
  const {priority, todo, status, category, dueDate} = request.body

  let updateTodoQuery = null
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    status = '${status}'
                WHERE
                    id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Status Updated')
      break
    case priority !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    priority = '${priority}'
                WHERE
                    id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Priority Updated')
      break
    case todo !== undefined:
      updateTodoQuery = `
                UPDATE
                    todo
                SET
                    todo = '${todo}'
                WHERE
                    id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case category !== undefined:
      const updateCategoryQuery = `
                UPDATE
                    todo
                SET
                    category = '${category}'
                WHERE
                    id = ${todoId}`
      await db.run(updateCategoryQuery)
      response.send('Category Updated')
      break
    case dueDate !== undefined:
      const updateDateQuery = `
                UPDATE
                    todo
                SET
                    due_date = '${dueDate}'
                WHERE
                    id = ${todoId}`
      await db.run(updateDateQuery)
      response.send('Due Date Updated')
      break
    default:
      response.status(400).send('Invalid Update Request')
  }
})

// Delete Todo API-6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
