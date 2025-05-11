import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    axios.get('/api/counter')
      .then(response => {
        setCount(response.data.value)
      })
  }, [])


  useEffect(() => {
    axios.get('/api/user')
      .then(response => {
        setUser(response.data)
      })
      .catch(error => {
        console.log('not logged in')
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
    window.location.href = '/api/login'
  }

  const onLogut = async () => {
    await axios.post('/api/logout')
    window.location.href = '/'
  }

  return (
    <>
      <h2>The Ohtucounter {user && `(${user.name} is logged in)`}</h2>
      <div>Count value is now {count}</div>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => setTo(count + 1)}>
          Increment
        </button>
        {user && <button onClick={() => setTo(0)}>
          Reset
        </button>}
      </div>
      <div style={{ marginTop: 10 }}>
        {!user && <button onClick={onLogin}>Login</button>}
        {user && <button onClick={onLogut}>Logout</button>}
      </div>
    </>
  )
}

export default App
