import request from 'supertest'
import app from './index.js'

describe('Todo Lists API', () => {
  describe('POST /api/todos/lists', () => {
    it('should create a new todo list', async () => {
      const res = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.title).toBe('Test List')
      expect(res.body.totalItems).toBe(0)
      expect(res.body.doneItems).toBe(0)
      expect(res.body.itemIds).toEqual([])
    })

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/todos/lists')
        .send({})

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('GET /api/todos/lists', () => {
    it('should get all todo lists', async () => {
      await request(app)
        .post('/api/todos/lists')
        .send({ title: 'List 1' })

      await request(app)
        .post('/api/todos/lists')
        .send({ title: 'List 2' })

      const res = await request(app).get('/api/todos/lists')

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /api/todos/lists/:id', () => {
    it('should get a specific todo list with items', async () => {
      const createRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = createRes.body.id

      const res = await request(app).get(`/api/todos/lists/${listId}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.id).toBe(listId)
      expect(res.body.title).toBe('Test List')
      expect(res.body).toHaveProperty('items')
      expect(Array.isArray(res.body.items)).toBe(true)
    })

    it('should return 404 for non-existent list', async () => {
      const res = await request(app).get('/api/todos/lists/99999')

      expect(res.statusCode).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PUT /api/todos/lists/:id', () => {
    it('should update a todo list title', async () => {
      const createRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Original Title' })

      const listId = createRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}`)
        .send({ title: 'Updated Title' })

      expect(res.statusCode).toBe(200)
      expect(res.body.title).toBe('Updated Title')
    })

    it('should return 404 for non-existent list', async () => {
      const res = await request(app)
        .put('/api/todos/lists/99999')
        .send({ title: 'New Title' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/todos/lists/:id', () => {
    it('should delete a todo list', async () => {
      const createRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'List to Delete' })

      const listId = createRes.body.id

      const deleteRes = await request(app).delete(`/api/todos/lists/${listId}`)

      expect(deleteRes.statusCode).toBe(200)

      const getRes = await request(app).get(`/api/todos/lists/${listId}`)
      expect(getRes.statusCode).toBe(404)
    })

    it('should return 404 for non-existent list', async () => {
      const res = await request(app).delete('/api/todos/lists/99999')

      expect(res.statusCode).toBe(404)
    })

    it('should delete all items when list is deleted', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'List with Items' })

      const listId = listRes.body.id

      await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item 1' })

      await request(app)
        .delete(`/api/todos/lists/${listId}`)

      const getRes = await request(app).get(`/api/todos/lists/${listId}`)
      expect(getRes.statusCode).toBe(404)
    })
  })

  describe('POST /api/todos/lists/:listId/items', () => {
    it('should create a new todo item', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const res = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Test Item' })

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.title).toBe('Test Item')
      expect(res.body.status).toBe('TODO')
      expect(res.body.listId).toBe(listId)
    })

    it('should return 404 if list does not exist', async () => {
      const res = await request(app)
        .post('/api/todos/lists/99999/items')
        .send({ title: 'Item' })

      expect(res.statusCode).toBe(404)
    })

    it('should create item with valid dueDate', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const res = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item with due date', dueDate: '2026-12-31T14:30' })

      expect(res.statusCode).toBe(201)
      expect(res.body.dueDate).toBe('2026-12-31T14:30')
    })

    it('should return 400 for invalid dueDate format', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const res = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item', dueDate: '2026-12-31' })

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should increment totalItems on list', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item 1' })

      await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item 2' })

      const getRes = await request(app).get(`/api/todos/lists/${listId}`)
      expect(getRes.body.totalItems).toBe(2)
    })
  })

  describe('GET /api/todos/lists/:listId/items', () => {
    it('should get all items in a list', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item 1' })

      await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item 2' })

      const res = await request(app).get(`/api/todos/lists/${listId}/items`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
    })

    it('should return 404 if list does not exist', async () => {
      const res = await request(app).get('/api/todos/lists/99999/items')

      expect(res.statusCode).toBe(404)
    })
  })

  describe('GET /api/todos/lists/:listId/items/:itemId', () => {
    it('should get a specific item', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Test Item' })

      const itemId = itemRes.body.id

      const res = await request(app).get(`/api/todos/lists/${listId}/items/${itemId}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.id).toBe(itemId)
      expect(res.body.title).toBe('Test Item')
    })

    it('should return 404 if item does not exist', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const res = await request(app).get(`/api/todos/lists/${listId}/items/99999`)

      expect(res.statusCode).toBe(404)
    })

    it('should return 404 if list does not exist', async () => {
      const res = await request(app).get('/api/todos/lists/99999/items/1')

      expect(res.statusCode).toBe(404)
    })
  })

  describe('PUT /api/todos/lists/:listId/items/:itemId', () => {
    it('should update item title', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Original Title' })

      const itemId = itemRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ title: 'Updated Title' })

      expect(res.statusCode).toBe(200)
      expect(res.body.title).toBe('Updated Title')
    })

    it('should update item dueDate with valid format', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item', dueDate: '2026-12-31T14:30' })

      const itemId = itemRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ dueDate: '2026-06-30T10:00' })

      expect(res.statusCode).toBe(200)
      expect(res.body.dueDate).toBe('2026-06-30T10:00')
    })

    it('should return 400 for invalid dueDate format on update', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item', dueDate: '2026-12-31T14:30' })

      const itemId = itemRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ dueDate: '2026-06-30' })

      expect(res.statusCode).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should update item status to DONE', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item' })

      const itemId = itemRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ status: 'DONE' })

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe('DONE')

      const listRes2 = await request(app).get(`/api/todos/lists/${listId}`)
      expect(listRes2.body.doneItems).toBe(1)
    })

    it('should update item status to TODO', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item' })

      const itemId = itemRes.body.id

      await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ status: 'DONE' })

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ status: 'TODO' })

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe('TODO')

      const listRes2 = await request(app).get(`/api/todos/lists/${listId}`)
      expect(listRes2.body.doneItems).toBe(0)
    })

    it('should return 400 for invalid status', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item' })

      const itemId = itemRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/${itemId}`)
        .send({ status: 'INVALID' })

      expect(res.statusCode).toBe(400)
    })

    it('should return 404 if item does not exist', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const res = await request(app)
        .put(`/api/todos/lists/${listId}/items/99999`)
        .send({ title: 'New Title' })

      expect(res.statusCode).toBe(404)
    })

    it('should return 404 if list does not exist', async () => {
      const res = await request(app)
        .put('/api/todos/lists/99999/items/1')
        .send({ title: 'New Title' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('DELETE /api/todos/lists/:listId/items/:itemId', () => {
    it('should delete an item', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item to Delete' })

      const itemId = itemRes.body.id

      const deleteRes = await request(app)
        .delete(`/api/todos/lists/${listId}/items/${itemId}`)

      expect(deleteRes.statusCode).toBe(200)

      const getRes = await request(app).get(`/api/todos/lists/${listId}/items/${itemId}`)
      expect(getRes.statusCode).toBe(404)
    })

    it('should decrement totalItems on list', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const itemRes = await request(app)
        .post(`/api/todos/lists/${listId}/items`)
        .send({ title: 'Item' })

      const itemId = itemRes.body.id

      const listBefore = await request(app).get(`/api/todos/lists/${listId}`)
      expect(listBefore.body.totalItems).toBe(1)

      await request(app).delete(`/api/todos/lists/${listId}/items/${itemId}`)

      const listAfter = await request(app).get(`/api/todos/lists/${listId}`)
      expect(listAfter.body.totalItems).toBe(0)
    })

    it('should return 404 if item does not exist', async () => {
      const listRes = await request(app)
        .post('/api/todos/lists')
        .send({ title: 'Test List' })

      const listId = listRes.body.id

      const res = await request(app).delete(`/api/todos/lists/${listId}/items/99999`)

      expect(res.statusCode).toBe(404)
    })

    it('should return 404 if list does not exist', async () => {
      const res = await request(app).delete('/api/todos/lists/99999/items/1')

      expect(res.statusCode).toBe(404)
    })
  })
})
