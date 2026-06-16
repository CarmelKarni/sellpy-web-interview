import React, { Fragment, useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material'
import ReceiptIcon from '@mui/icons-material/Receipt'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { TodoListForm } from './TodoListForm'
import { API_BASE_URL } from '../../config'
import './TodoLists.css'

const getListStatus = (list) => {
  console.log('getListStatus list:', list) // --- IGNORE ---
  const total = list.totalItems
  const done = list.doneItems
  if (total === 0) return null
  if (done === total) return 'DONE'
  return 'IN PROGRESS'
}

const getItemCounts = (list) => {
  console.log('getItemCounts list:', list) // --- IGNORE ---
  const total = list.totalItems
  const done = list.doneItems
  return { done, total }
}

const fetchTodoLists = () => {
  return fetch(`${API_BASE_URL}/lists`)
    .then((response) => response.json())
    .then((lists) => {
      const listsMap = {}
      lists.forEach((list) => {
        console.log('fetchTodoLists list:', list)
        listsMap[list.id] = {
          id: list.id,
          title: list.title,
          totalItems: list.totalItems,
          doneItems: list.doneItems,
        }
      })
      return listsMap
    })
}

export const TodoLists = ({ style }) => {
  const [todoLists, setTodoLists] = useState({})
  const [activeList, setActiveList] = useState()
  const [activeListDetails, setActiveListDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({ title: '' })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchTodoLists()
      .then(setTodoLists)
      .catch((err) => {
        console.error('Failed to fetch todo lists:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [refreshTrigger])

  const handleOpenDialog = () => {
    setFormData({ title: '' })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setFormData({ title: '' })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectList = async (listId) => {
    setActiveList(listId)
    try {
      const response = await fetch(`${API_BASE_URL}/lists/${listId}`)
      if (!response.ok) throw new Error('Failed to fetch list details')
      const listDetails = await response.json()
      console.log('Fetched list details:', listDetails)
      setActiveListDetails(listDetails)
    } catch (err) {
      console.error('Error fetching list details:', err)
      alert('Failed to load list details')
    }
  }

  const handleDeleteList = async (e, listId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this list?')) return

    try {
      const response = await fetch(`http://localhost:3001/api/todos/lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete list')

      setTodoLists((prev) => {
        const updated = { ...prev }
        delete updated[listId]
        return updated
      })

      if (activeList === listId) {
        setActiveList(null)
        setActiveListDetails(null)
      }
    } catch (err) {
      console.error('Error deleting list:', err)
      alert('Failed to delete list')
    }
  }

  const handleCreateNewList = async () => {
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title }),
      })

      if (!response.ok) throw new Error('Failed to create list')

      const newList = await response.json()
      setTodoLists((prev) => ({
        ...prev,
        [newList.id]: {
          id: newList.id,
          title: newList.title,
          totalItems: newList.totalItems,
          doneItems: newList.doneItems,
        },
      }))
      handleCloseDialog()
    } catch (err) {
      console.error('Error creating list:', err)
      alert('Failed to create list')
    }
  }

  if (loading) return <Typography>Loading todo lists...</Typography>
  if (error) return <Typography color='error'>Error: {error}</Typography>
  // if (!Object.keys(todoLists).length) return <Typography>No todo lists found</Typography>
  return (
    <Fragment>
      <Card style={style} className='todo-lists-container'>
        <CardContent>
          <Box className='todo-lists-header'>
            <Typography component='h2'>My Todo Lists</Typography>
            <Button
              variant='contained'
              color='primary'
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              size='small'
            >
              Create New List
            </Button>
          </Box>
          <List>
            {Object.keys(todoLists).map((key) => {
              const listStatus = getListStatus(todoLists[key])
              const statusColor = listStatus === 'DONE' ? 'success' : 'warning'
              const { done, total } = getItemCounts(todoLists[key])
              return (
                <Box key={key} className='todo-list-item-wrapper'>
                  <ListItemButton
                    onClick={() => handleSelectList(key)}
                    className='todo-list-item-button'
                  >
                    <Box className='todo-list-item-content'>
                      <ListItemIcon>
                        <ReceiptIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${todoLists[key].title} (${done}/${total})`}
                      />
                    </Box>
                    {listStatus && (
                      <Chip
                        className='todo-list-status-chip'
                        label={listStatus}
                        color={statusColor}
                        size='small'
                      />
                    )}
                  </ListItemButton>
                  <Button
                    className='todo-list-delete-btn'
                    size='small'
                    color='error'
                    onClick={(e) => handleDeleteList(e, key)}
                  >
                    <DeleteIcon />
                  </Button>
                </Box>
              )
            })}
          </List>
        </CardContent>
      </Card>
      {activeListDetails && (
        <TodoListForm
          key={activeList}
          todoList={activeListDetails}
          saveTodoList={(id, { items }) => {
            const listToUpdate = todoLists[id]
            setTodoLists({
              ...todoLists,
              [id]: { ...listToUpdate, items },
            })
            setActiveListDetails((prev) => ({ ...prev, items }))
          }}
          onItemsChange={async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/lists/${activeList}`)
              if (!response.ok) {
                const text = await response.text()
                console.error('Response status:', response.status, 'Body:', text)
                throw new Error('Failed to fetch list details')
              }
              const listDetails = await response.json()
              setActiveListDetails(listDetails)
              setRefreshTrigger((prev) => prev + 1)
            } catch (err) {
              console.error('Error refreshing list details:', err)
            }
          }}
        />
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Create New Todo List</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label='Title'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            margin='normal'
            placeholder='Enter list title'
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateNewList} variant='contained' color='primary'>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}
