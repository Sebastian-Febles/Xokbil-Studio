# Xokbil Studio

Inicio web de Xokbil Studio para talleres de confección de Tekit. El incremento de Manuel Almeida incluye navegación, configuración de prendas y seguimiento de órdenes con datos ficticios.

## Ejecutar

Requiere Node.js 22.12 o posterior.

```sh
npm ci
npm run dev
npm test
npm run build
```

Vite indica la URL de desarrollo en su salida. `npm run preview` sirve la compilación local. Las rutas usan fragmentos, por lo que el servidor estático puede servir `dist/` sin reglas especiales para rutas de la aplicación.

## Demostración

- **A1.** Desde el panel abre las cinco secciones. El menú se adapta a pantalla estrecha y al rol de demostración.
- **A7.** En Pedidos y ventas abre Configurar prenda. Aplica Clásica Tekit, avanza por las opciones, vuelve a editar la talla y revisa el resumen. Introduce alforzas que superen 16 cm por grupo para comprobar el error. Este ancho es un límite ilustrativo de diseño, independiente del consumo textil de A8.
- **A10.** En Órdenes de producción alterna Lista y Tablero, filtra por etapa y avanza una orden. DEMO-001 se bloquea en Listo para entrega por saldo pendiente. DEMO-003 permite comprobar la entrega. El panel refleja los cambios durante la sesión.

La demostración conserva las órdenes mientras la página siga abierta. Los roles controlan la visibilidad de la interfaz. Autenticación, persistencia, compras, pagos, inventario, movimientos de stock, archivos DST y fichas PDF quedan sujetos a la integración del equipo.

## Código e integración

| Ubicación | Responsabilidad |
| --- | --- |
| `src/main.tsx` | Layout, navegación, roles de muestra, panel y rutas |
| `src/Configurator.tsx` | Formulario de prenda, plantillas y resumen |
| `src/Production.tsx` | Lista, tablero, filtros y controles de avance |
| `src/domain.ts` | Contratos del frontend, catálogo y órdenes de demostración, validadores |
| `src/styles.css` | Tailwind, paleta, componentes y ajustes responsivos |
| `tests/domain.test.ts` | Casos de configuración y producción |

El catálogo real debe proporcionar identificadores, disponibilidad y referencias de bordado. A8 recibirá las especificaciones del configurador para calcular consumo y costos. Producción recibirá de A9 un pedido confirmado y una orden única. El backend deberá aplicar la política de inventario acordada por el equipo y validar cada transición, con control de concurrencia. La actualización local de la demostración solo modifica la etapa y la hora en la sesión actual.

[Cronograma](https://app.notion.com/p/939fe7032df2425a85d822b387956294) · [Prototipo](https://www.figma.com/proto/GV7G3XNhdq0gYMi5aNc5Cl?node-id=9-828)
