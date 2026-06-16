const API_ADDRESS = process.env.REACT_APP_API_ADDRESS || 'localhost'
const API_PORT = process.env.REACT_APP_API_PORT || 3001

export const API_BASE_URL = `http://${API_ADDRESS}:${API_PORT}/api/todos`
