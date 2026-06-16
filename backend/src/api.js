import express from 'express'

const router = express.Router()

const validateDueDate = (dueDate) => {
  if (!dueDate) return true
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
  return dateRegex.test(dueDate)
}

// In-memory storage
const todoLists = new Map()
const todoItems = new Map()
let listIdCounter = 1
let itemIdCounter = 1

// ===== TODO LIST CRUD OPERATIONS =====

// Create a new todo list
router.post('/lists', (req, res) => {
  const { title } = req.body

  if (!title) {
    return res.status(400).json({ error: 'Title is required' })
  }

  const id = listIdCounter++
  const newList = {
    id,
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalItems: 0,
    doneItems: 0,
    itemIds: [],
  }

  todoLists.set(id, newList)
  res.status(201).json(newList)
})

// Get all todo lists
router.get('/lists', (req, res) => {
  const lists = Array.from(todoLists.values()).map((list) => ({
    id: list.id,
    title: list.title,
    totalItems: list.totalItems,
    doneItems: list.doneItems,
    createdAt: list.createdAt?.toISOString(),
    updatedAt: list.updatedAt?.toISOString(),
  }))
  res.json(lists)
})

// Get a specific todo list by id
router.get('/lists/:id', (req, res) => {
  const list = todoLists.get(parseInt(req.params.id))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const listWithItems = {
    id: list.id,
    title: list.title,
    totalItems: list.totalItems,
    doneItems: list.doneItems,
    createdAt: list.createdAt?.toISOString(),
    updatedAt: list.updatedAt?.toISOString(),
    items: list.itemIds.map((itemId) => {
      const item = todoItems.get(itemId)
      return item ? {
        ...item,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString(),
      } : null
    }).filter(Boolean),
  }

  res.json(listWithItems)
})

// Update a todo list
router.put('/lists/:id', (req, res) => {
  const list = todoLists.get(parseInt(req.params.id))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const { title } = req.body

  if (title !== undefined) list.title = title
  list.updatedAt = new Date()

  res.json(list)
})

// Delete a todo list
router.delete('/lists/:id', (req, res) => {
  const list = todoLists.get(parseInt(req.params.id))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  // Delete all items in the list
  list.itemIds.forEach((itemId) => todoItems.delete(itemId))
  todoLists.delete(parseInt(req.params.id))

  res.json({ message: 'Todo list deleted successfully' })
})

// ===== TODO ITEM CRUD OPERATIONS =====

// Create a new todo item in a list
router.post('/lists/:listId/items', (req, res) => {
  const list = todoLists.get(parseInt(req.params.listId))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const { title, dueDate } = req.body

  if (dueDate && !validateDueDate(dueDate)) {
    return res.status(400).json({ error: 'Invalid due date format. Use YYYY-MM-DDTHH:mm' })
  }

  const id = itemIdCounter++
  const newItem = {
    id,
    listId: parseInt(req.params.listId),
    title,
    dueDate: dueDate || null,
    status: 'TODO',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  todoItems.set(id, newItem)
  list.itemIds.push(id)
  list.totalItems = (list.totalItems || 0) + 1
  list.updatedAt = new Date()

  res.status(201).json(newItem)
})

// Get all items in a list
router.get('/lists/:listId/items', (req, res) => {
  const list = todoLists.get(parseInt(req.params.listId))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const items = list.itemIds.map((itemId) => todoItems.get(itemId)).filter(Boolean)
  res.json(items)
})

// Get a specific todo item
router.get('/lists/:listId/items/:itemId', (req, res) => {
  const list = todoLists.get(parseInt(req.params.listId))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const item = todoItems.get(parseInt(req.params.itemId))

  if (!item || item.listId !== parseInt(req.params.listId)) {
    return res.status(404).json({ error: 'Todo item not found' })
  }

  res.json(item)
})

// Update a todo item
router.put('/lists/:listId/items/:itemId', (req, res) => {
  const list = todoLists.get(parseInt(req.params.listId))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const item = todoItems.get(parseInt(req.params.itemId))

  if (!item || item.listId !== parseInt(req.params.listId)) {
    return res.status(404).json({ error: 'Todo item not found' })
  }

  const { title, dueDate, status } = req.body

  if (dueDate !== undefined && !validateDueDate(dueDate)) {
    return res.status(400).json({ error: 'Invalid due date format. Use YYYY-MM-DDTHH:mm' })
  }

  if (status !== undefined) {
    const validStatuses = ['TODO', 'DONE']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: TODO, DONE' })
    }

    if (item.status !== status) {
      if (status === 'DONE') {
        const list = todoLists.get(item.listId)
        list.doneItems = (list.doneItems || 0) + 1
      }
      else {
        const list = todoLists.get(item.listId)
        list.doneItems = Math.max((list.doneItems || 0) - 1, 0)
      }
      item.status = status
    }
  }

  if (title !== undefined) item.title = title
  if (dueDate !== undefined) item.dueDate = dueDate
  item.updatedAt = new Date()

  res.json(item)
})

// Delete a todo item
router.delete('/lists/:listId/items/:itemId', (req, res) => {
  const list = todoLists.get(parseInt(req.params.listId))

  if (!list) {
    return res.status(404).json({ error: 'Todo list not found' })
  }

  const item = todoItems.get(parseInt(req.params.itemId))

  if (!item || item.listId !== parseInt(req.params.listId)) {
    return res.status(404).json({ error: 'Todo item not found' })
  }

  list.itemIds = list.itemIds.filter((id) => id !== parseInt(req.params.itemId))
  list.totalItems = Math.max((list.totalItems || 0) - 1, 0)
  if (item.status === 'DONE') {
    list.doneItems = (list.doneItems || 0) - 1
  }
  
  list.updatedAt = new Date()
  todoItems.delete(parseInt(req.params.itemId))

  res.json({ message: 'Todo item deleted successfully' })
})

export default router
