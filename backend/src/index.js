import express from 'express'
import cors from 'cors'
import todoApi from './api.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/todos', todoApi)

app.get('/', (req, res) => res.send('Hello World!'))

const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
}

export default app
