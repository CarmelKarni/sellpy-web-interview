import React, { useState, useEffect } from 'react'
import { TextField, Card, CardContent, CardActions, Button, Typography, Checkbox, Box } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { API_BASE_URL } from '../../config'
import './TodoListForm.css'

export const TodoListForm = ({ todoList, saveTodoList, onItemsChange }) => {
  const [todos, setTodos] = useState(todoList.items || [])

  useEffect(() => {
    setTodos(todoList.items || [])
  }, [todoList.id, todoList.items])

  const handleCheckboxChange = async (index, item) => {
    const newStatus = item.status === 'DONE' ? 'TODO' : 'DONE'

    try {
      const response = await fetch(
        `${API_BASE_URL}/lists/${todoList.id}/items/${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (!response.ok) throw new Error('Failed to update item')

      const updatedItem = await response.json()
      const newTodos = [...todos]
      newTodos[index] = updatedItem
      setTodos(newTodos)
      onItemsChange?.()
    } catch (err) {
      console.error('Error updating item status:', err)
      alert('Failed to update item status')
    }
  }

  const handleTitleChange = async (event, index, item) => {
    const newTitle = event.target.value
    const newTodos = [...todos]
    newTodos[index] = { ...item, title: newTitle }
    setTodos(newTodos)

    try {
      if (item.id) {
        // Update existing item
        const response = await fetch(
          `${API_BASE_URL}/lists/${todoList.id}/items/${item.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
          }
        )
        if (!response.ok) throw new Error('Failed to update item')
      }
    } catch (err) {
      console.error('Error updating item:', err)
      alert('Failed to save item')
    }
  }

  const handleAddItem = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lists/${todoList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend error:', errorData)
        throw new Error(errorData.error || 'Failed to create item')
      }

      const newItem = await response.json()
      setTodos([...todos, newItem])
      onItemsChange?.()
    } catch (err) {
      console.error('Error creating item:', err)
      alert(`Failed to add item: ${err.message}`)
    }
  }

  const handleDeleteItem = async (index, item) => {
    try {
      if (item.id) {
        const response = await fetch(
          `${API_BASE_URL}/lists/${todoList.id}/items/${item.id}`,
          { method: 'DELETE' }
        )
        if (!response.ok) throw new Error('Failed to delete item')
      }
      setTodos([...todos.slice(0, index), ...todos.slice(index + 1)])
      onItemsChange?.()
    } catch (err) {
      console.error('Error deleting item:', err)
      alert('Failed to delete item')
    }
  }

  return (
    <Card className='todo-list-form'>
      <CardContent>
        <Typography component='h2'>{todoList.title}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {todos.map((item, index) => (
            <Box key={item.id || index} className='todo-item'>
              <Checkbox
                checked={item.status === 'DONE'}
                onChange={() => handleCheckboxChange(index, item)}
              />
              <Typography className='todo-item-number' variant='h6'>
                {index + 1}
              </Typography>
              <TextField
                className={`todo-item-input ${item.status === 'DONE' ? 'completed' : ''}`}
                label='What to do?'
                value={item.title || ''}
                onChange={(event) => handleTitleChange(event, index, item)}
              />
              <Button
                className='todo-item-delete-btn'
                size='small'
                color='secondary'
                onClick={() => handleDeleteItem(index, item)}
              >
                <DeleteIcon />
              </Button>
            </Box>
          ))}
          <CardActions className='todo-actions'>
            <Button color='primary' onClick={handleAddItem}>
              Add Todo <AddIcon />
            </Button>
          </CardActions>
        </Box>
      </CardContent>
    </Card>
  )
}
