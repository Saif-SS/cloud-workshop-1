'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/lib/types';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const moveTodoUp = (id: string) => {
    setTodos((prevTodos) => {
      const index = prevTodos.findIndex((todo) => todo.id === id);
      if (index > 0) {
        const newTodos = [...prevTodos];
        const [movedTodo] = newTodos.splice(index, 1);
        newTodos.splice(index - 1, 0, movedTodo);
        return newTodos;
      }
      return prevTodos;
    });
  }; 

  const completeTodo = async (id: string) => {
    try {
      setError('');
      // Optimistic update
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to complete todo');
      console.error('Error completing todo:', err);
    }
  };

  const undoCompleteTodo = async (id: string) => {
    try {
      setError('');
      // Optimistic update
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id ? { ...todo, completed: false } : todo
        )
      );
    } catch (err) {
      setError('Failed to undo complete todo');
      console.error('Error undoing complete todo:', err);
    }
  };

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data.todos);
      setLastFetchTime(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Failed to fetch todos');
      console.error('Error fetching todos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchTodos();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodoText.trim()) return;

    try {
      setIsAdding(true);
      setError('');

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newTodoText }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      const data = await response.json();

      // Optimistic update
      setTodos([...todos, data.todo]);
      setNewTodoText('');
    } catch (err) {
      setError('Failed to add todo');
      console.error('Error adding todo:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      setError('');

      // Optimistic update
      setTodos(todos.filter(todo => todo.id !== id));

      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error deleting todo:', err);
      // Refresh to get actual state
      fetchTodos();
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Serverless Todo App
          </h1>
          <p className="text-gray-600">
            A demo of in-memory storage limitations
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg shadow-md">
          <p className="text-sm text-yellow-800">
            <span className="font-bold">⚠️ Demo Mode:</span> Todos are stored in-memory and will
            disappear when the serverless function restarts!
            This shows why we need databases. 🎓
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-grey-100 rounded-lg shadow-lg p-6 mb-6">
          {/* Add Todo Form */}
          <form onSubmit={addTodo} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Whats the next todo?"
                className="flex-1 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAdding}
              />
              <button
                type="submit"
                disabled={isAdding || !newTodoText.trim()}
                className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAdding ? 'Adding...' : 'Add Todo'}
              </button>
            </div>
          </form>

          {/* Loading State */}
          {isLoading && todos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Loading todos...
            </div>
          )}

          {/* Todo List */}
          {!isLoading && todos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No todos yet! Add one above 👆
            </div>
          )}

          {todos.length > 0 && (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-gray-800">{todo.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRelativeTime(todo.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Change order of todos */}
          {todos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Change order of todos</h3>
              <ul className="list-disc list-inside space-y-1">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center justify-between">
                    <span className="text-gray-800">{todo.text}</span>
                    <button
                      onClick={() => moveTodoUp(todo.id)}
                      className="ml-4 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Move Up
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Current session: {todos.length} {todos.length === 1 ? 'todo' : 'todos'}
              {lastFetchTime && (
                <> | Last fetched: {lastFetchTime}</>
              )}
            </p>
          </div>
        </div>
        
        {/* Complete todo */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Complete a todo (optional)</h3>
          <p className="text-gray-700 mb-4"> Click to complete or undo complete a todo:</p>
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => todo.completed ? undoCompleteTodo(todo.id) : completeTodo(todo.id)}
                className={`p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${todo.completed ? 'bg-green-100' : 'bg-gray-50'}`}
              >
                <p className={`text-gray-800 ${todo.completed ? 'line-through' : ''}`}>
                  {todo.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            🎓 How to see the reset:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Add some todos</li>
            <li>Wait 1-2 minutes (or redeploy on Vercel)</li>
            <li>Refresh the page</li>
            <li>Todos are gone! This is serverless in action.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
