export type User = {
  id_usuario: number
  id_rol: number
  nombre_rol: string
  nombre: string
  correo: string
}

export type Role = {
  id_rol: number
  nombre_rol: string
}

export type Product = {
  id_producto: number
  codigo_barras: string | null
  nombre_producto: string
  marca: string | null
  precio_venta: number | string
  stock_actual: number | string
  descripcion: string | null
  estado?: string | null
}
