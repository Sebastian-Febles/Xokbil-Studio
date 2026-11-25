# Xokbil Studio

Aplicación web de demostración para talleres de confección de Tekit. Permite probar el recorrido desde el cliente hasta la entrega con datos ficticios.

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
- **A4.** En Clientes busca un registro por nombre o teléfono, consulta su historial o registra un cliente de prueba. Usa **Configurar pedido** para llevar ese cliente al formulario.
- **A7 y A9.** Aplica Clásica Tekit y elige la talla. Revisa frente, espalda y bordado. En Resumen conserva el precio de muestra de $900 por prenda, ingresa un anticipo de $500 y confirma la aprobación. Dos piezas dan un total de $1,800 con saldo de $1,300. El pedido aparece en ventas y en producción con el mismo folio.
- **A10.** Desde Administración abre Producción, alterna Lista y Tablero y avanza la orden. Al llegar a Listo para entrega, el saldo pendiente bloquea el cierre. Abre la cuenta, registra un abono parcial o usa el saldo completo y vuelve al tablero para entregar. También puedes probar este recorrido con DEMO-001.
- **A11.** Abre la ficha desde el pedido o la orden de producción. En el diálogo de impresión puedes guardarla como PDF. La ficha conserva la configuración aprobada.

Los datos se guardan en la sesión del navegador y se conservan al recargar la misma pestaña. Los roles son de demostración. Usa clientes y pagos ficticios.

## Código e integración

| Ubicación | Responsabilidad |
| --- | --- |
| `src/main.tsx` | Layout, navegación, roles de muestra, panel y rutas |
| `src/Customers.tsx` | Directorio, alta e historial |
| `src/Configurator.tsx` | Formulario de prenda, plantillas, cotización y aprobación |
| `src/Sales.tsx` | Pedidos, cuenta, abonos y ficha técnica |
| `src/Production.tsx` | Lista, tablero, filtros y controles de avance |
| `src/domain.ts` | Contratos del frontend, catálogo y órdenes de demostración, validadores |
| `src/styles.css` | Tailwind, paleta, componentes y ajustes responsivos |
| `tests/domain.test.ts` | Casos de configuración y producción |

Quedan por integrar Supabase y el control de acceso, inventario y archivos DST, el cálculo textil con patronaje validado, y la política de stock. La cotización actual usa un precio editable por prenda. Cada pedido local registra un solo diseño con su cantidad. El backend deberá confirmar pedidos, folios, pagos y stock de forma transaccional para permitir el trabajo simultáneo.

[Cronograma](https://app.notion.com/p/939fe7032df2425a85d822b387956294) · [Prototipo](https://www.figma.com/proto/GV7G3XNhdq0gYMi5aNc5Cl?node-id=9-828)
