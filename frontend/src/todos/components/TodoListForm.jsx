import React, { useState, useEffect } from 'react'
import { TextField, Card, CardContent, CardActions, Button, Typography, Checkbox, Box } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { API_BASE_URL } from '../../config'
import './TodoListForm.css'

const calculateRemainingTime = (dueDate) => {
  if (!dueDate) return null

  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due - now

  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs)
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))
    return { days, hours, minutes, isOverdue: true }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, minutes, isOverdue: false }
}

const formatRemainingTime = (remaining) => {
  if (!remaining) return ''
  const { days, hours, minutes } = remaining
  return `${days}d ${hours}h ${minutes}m`
}

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

  const handleDueDateChange = async (event, index, item) => {
    const newDueDate = event.target.value
    const newTodos = [...todos]
    newTodos[index] = { ...item, dueDate: newDueDate || null }
    setTodos(newTodos)

    try {
      if (item.id) {
        const response = await fetch(
          `${API_BASE_URL}/lists/${todoList.id}/items/${item.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dueDate: newDueDate || null }),
          }
        )
        if (!response.ok) throw new Error('Failed to update item')
      }
    } catch (err) {
      console.error('Error updating due date:', err)
      alert('Failed to save due date')
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
          {todos.map((item, index) => {
            const remaining = (item.dueDate)
            return (
              <Box key={item.id || index} className='todo-item'>
                <Checkbox
                  checked={item.status === 'DONE'}
                  onChange={() => handleCheckboxChange(index, item)}
                />
                <Typography className='todo-item-number' variant='h6'>
                  {index + 1}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, marginTop: '1rem', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1, gap: 0.5 }}>
                    <TextField
                      className={`todo-item-input ${item.status === 'DONE' ? 'completed' : ''}`}
                      label='What to do?'
                      value={item.title || ''}
                      onChange={(event) => handleTitleChange(event, index, item)}
                      fullWidth
                    />
                    <TextField
                      type='datetime-local'
                      label='Due Date'
                      value={item.dueDate || ''}
                      onChange={(event) => handleDueDateChange(event, index, item)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Box>
                  <Typography
                    sx={{
                      marginTop: '1rem',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      fontWeight: item.status === 'DONE' ? 'bold' : 'normal',
                      color: item.status === 'DONE' ? '#fff' : remaining?.isOverdue ? '#fff' : '#666',
                      backgroundColor: item.status === 'DONE' ? '#4caf50' : remaining?.isOverdue ? '#d32f2f' : '#f5f5f5',
                      width: '140px',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                    }}
                  >
                    {item.status === 'DONE' ? 'Done' : item.dueDate ? formatRemainingTime(remaining) : 'No due date'}
                  </Typography>
                </Box>
                <Button
                  className='todo-item-delete-btn'
                  size='small'
                  color='secondary'
                  onClick={() => handleDeleteItem(index, item)}
                >
                  <DeleteIcon />
                </Button>
              </Box>
            )
          })}
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
