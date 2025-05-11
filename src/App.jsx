import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    axios.get('/api/counter')
      .then(response => {
        setCount(response.data.value)
      })
  }, [])

  if (count === null) {
    return null
  }

  const updateCounter = (newCount) => {
    axios.post('/api/counter', { value: newCount })
      .then(response => {
        console.log('Counter updated:', response.data)
      })
  }

  const setTo = (newCount) => {
    setCount(newCount)
    updateCounter(newCount)
  }

  const onLogin = () => {
    axios.get('/api/login')
      .then(response => {
        console.log('Login successful:', response.data)
      })
      .catch(error => {
        console.error('Login failed:', error)
      })
  }

  return (
    <>
      <h2>The Ohtucounter</h2>
      <div>Count value is now {count}</div>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => setTo(count + 1)}>
          Increment
        </button>
        <button onClick={() => setTo(0)}>
          Reset
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={onLogin}>
          Login
        </button>
      </div>
    </>
  )
}

export default App
