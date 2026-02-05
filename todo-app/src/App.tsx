import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Todo = {
  id: string
  title: string
  completed: boolean
}

const storageKey = 'portfolio-todos'
const createId = () =>
  'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Todo[]
      if (Array.isArray(parsed)) {
        setTodos(parsed)
      }
    } catch {
      // ignore invalid localStorage data
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(todos))
  }, [todos])

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setTodos((prev) => [
      { id: createId(), title: trimmed, completed: false },
      ...prev,
    ])
    setTitle('')
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-label">Todoリスト</p>
        <h1>今日やること</h1>
        <p className="app-subtitle">React + localStorage で保存されます</p>
      </header>

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="やることを入力"
          aria-label="やること"
        />
        <button type="submit">追加</button>
      </form>

      <div className="todo-summary">
        <span>合計: {todos.length}</span>
        <span>残り: {remainingCount}</span>
      </div>

      {todos.length === 0 ? (
        <p className="todo-empty">まだ項目がありません。</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`todo-item ${todo.completed ? 'done' : ''}`}
            >
              <label className="todo-title">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.title}</span>
              </label>
              <button
                type="button"
                className="delete-button"
                onClick={() => deleteTodo(todo.id)}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
