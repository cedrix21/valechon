import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Report from './Report.jsx'
import Admin from './Admin.jsx'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/report", 
    element: <Report />,
  },
  {
    path: "/admin", // The new Admin URL
    element: <Admin />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)