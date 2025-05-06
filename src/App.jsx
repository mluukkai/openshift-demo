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

  return (
    <>
      <div>count is {count}</div>
      <button onClick={() => setTo(count + 1)}>
        increment
      </button>
      <button onClick={() => setTo(0)}>
        reset
      </button>
    </>
  )
}

export default App
