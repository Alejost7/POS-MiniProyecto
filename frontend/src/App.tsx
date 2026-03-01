import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import InventoryPage from './pages/InventoryPage'
import LoginPage from './pages/LoginPage'
import UserCreatePage from './pages/UserCreatePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/inicio" element={<HomePage />} />
      <Route path="/inventario" element={<InventoryPage />} />
      <Route path="/usuarios/nuevo" element={<UserCreatePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
