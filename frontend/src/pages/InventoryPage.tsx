import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config/api'
import type { Product, User } from '../types/auth'

export default function InventoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchingProducts, setFetchingProducts] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const navigate = useNavigate()

  const isAdmin = useMemo(() => {
    if (!user) {
      return false
    }

    return user.id_rol === 1 || user.nombre_rol.toLowerCase().includes('admin')
  }, [user])

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me.php`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          navigate('/', { replace: true })
          return
        }

        const data = await response.json()
        setUser(data.user ?? null)
      } catch {
        navigate('/', { replace: true })
      }
    }

    void verifySession()
  }, [navigate])

  useEffect(() => {
    const controller = new AbortController()

    const loadProducts = async () => {
      setFetchingProducts(true)
      setError('')

      try {
        const query = encodeURIComponent(search.trim())
        const response = await fetch(`${API_BASE}/productos/read.php?q=${query}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setError(data.error ?? 'No fue posible consultar productos')
          return
        }

        setProducts(Array.isArray(data.productos) ? data.productos : [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('No fue posible consultar productos')
        }
      } finally {
        setFetchingProducts(false)
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      void loadProducts()
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  const handleLogicalDelete = async (idProducto: number) => {
    const confirmed = window.confirm('Este producto se marcara como inactivo. Deseas continuar?')

    if (!confirmed) {
      return
    }

    setDeletingId(idProducto)
    setDeleteError('')

    try {
      const response = await fetch(`${API_BASE}/productos/delete.php`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_producto: idProducto }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setDeleteError(data.error ?? 'No fue posible eliminar el producto')
        return
      }

      setProducts((prev) => prev.filter((item) => item.id_producto !== idProducto))
    } catch {
      setDeleteError('No fue posible eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="app-shell">
      <section className="panel wide-panel">
        <div className="panel-header-row">
          <h1>Inventario</h1>
          <Link to="/inicio" className="btn-primary link-btn">
            Volver
          </Link>
        </div>

        <p>Busqueda en tiempo real por nombre o codigo de barras.</p>

        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre o codigo de barras"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error ? <p className="error-message">{error}</p> : null}
        {deleteError ? <p className="error-message">{deleteError}</p> : null}

        {loading ? <p>Cargando inventario...</p> : null}
        {!loading && fetchingProducts ? <p>Actualizando resultados...</p> : null}

        <div className="table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                {isAdmin ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>Sin resultados</td>
                </tr>
              ) : (
                products.map((product) => {
                  const stockValue = Number(product.stock_actual)
                  const priceValue = Number(product.precio_venta)
                  const status = product.estado ?? 'activo'

                  return (
                    <tr key={product.id_producto}>
                      <td>{product.codigo_barras ?? '-'}</td>
                      <td>{product.nombre_producto}</td>
                      <td>${priceValue.toFixed(2)}</td>
                      <td>{Number.isFinite(stockValue) ? stockValue : product.stock_actual}</td>
                      <td>{status}</td>
                      {isAdmin ? (
                        <td>
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={deletingId === product.id_producto}
                            onClick={() => void handleLogicalDelete(product.id_producto)}
                          >
                            {deletingId === product.id_producto ? 'Eliminando...' : 'Inactivar'}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
