# SPEC-CODIGO - Convenciones y Estándares de Código

## I. Principios Generales

### Código Auto-Documentado
- El código debe ser legible por sí mismo
- Los nombres de variables, funciones y clases deben ser descriptivos
- Los comentarios solo se usan para decisiones no obvias o algoritmos complejos

### Principio del Cañón y la Mosca
- Elegir siempre la solución más simple que resuelva el problema eficientemente
- No sobre-ingeniería: YAGNI (You Aren't Gonna Need It)
- Refactorizar cuando la complejidad lo justifique, no antes

### Tipado Fuerte
- TypeScript con tipos explícitos en APIs públicas
- Evitar `any` salvo casos excepcionales documentados
- Usar tipos de unión e intersección para modelar dominios complejos

## II. Convenciones de Nombres

### Archivos y Carpetas
- **Componentes React:** PascalCase `UserProfile.tsx`
- **Utilidades y hooks:** camelCase `useAuth.ts`, `formatDate.ts`
- **Constantes:** SCREAMING_SNAKE_CASE `API_BASE_URL.ts`
- **Carpetas:** kebab-case `user-profile/`, `api-routes/`

### Variables y Funciones
- **Variables:** camelCase `userName`, `isLoading`
- **Constantes:** SCREAMING_SNAKE_CASE `MAX_RETRIES`, `API_KEY`
- **Funciones:** camelCase con verbo `fetchUser()`, `validateEmail()`
- **Predicados booleanos:** prefix `is`, `has`, `should` → `isValid`, `hasPermission`

### Clases e Interfaces
- **Clases:** PascalCase `UserService`, `DatabaseConnection`
- **Interfaces:** PascalCase sin prefijo I → `User`, `AuthConfig` (no `IUser`)
- **Types:** PascalCase `RequestPayload`, `ApiResponse`
- **Enums:** PascalCase con valores SCREAMING_SNAKE_CASE
  ```typescript
  enum UserRole {
    ADMIN = 'ADMIN',
    OPERATOR = 'OPERATOR',
    CLIENT = 'CLIENT'
  }
  ```

## III. Política de Comentarios

### Qué NO comentar
- ❌ Parafrasear código obvio
  ```typescript
  // BAD
  // Incrementa el contador en 1
  counter++;
  ```
- ❌ Código muerto comentado (usar git para historial)
- ❌ Comentarios desactualizados o contradictorios con el código

### Qué SÍ comentar
- ✅ Decisiones de diseño no obvias
  ```typescript
  // Usamos debounce de 300ms para evitar llamadas excesivas a la API
  // durante el tipeo del usuario (ver SPEC-PERFORMANCE §4.2)
  const debouncedSearch = debounce(searchAPI, 300);
  ```
- ✅ Algoritmos complejos o math-heavy
- ✅ Workarounds temporales con referencia a issue
  ```typescript
  // WORKAROUND: Firebase SDK 9.x no soporta array-contains-any con >10 items
  // Ver: https://github.com/firebase/firebase-js-sdk/issues/1234
  ```
- ✅ TODOs con contexto y asignación
  ```typescript
  // TODO(SOFIA): Migrar a Firestore batch writes cuando tengamos >500 docs
  ```

## IV. Estructura de Archivos

### Módulos TypeScript
```typescript
// 1. Imports (externos primero, luego internos)
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { User } from '@/types';

// 2. Types/Interfaces locales (si no se exportan)
interface LocalState {
  loading: boolean;
  data: User[];
}

// 3. Constantes
const MAX_ITEMS = 100;

// 4. Componente o lógica principal
export function UserList() {
  // ...
}

// 5. Helpers/utilidades (si son privadas al módulo)
function sortByName(users: User[]) {
  // ...
}
```

### React Components
```typescript
// Props interface primero
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// Component function
export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // 1. Hooks
  const [isPressed, setIsPressed] = useState(false);
  
  // 2. Efectos
  useEffect(() => {
    // ...
  }, []);
  
  // 3. Handlers
  const handleClick = () => {
    setIsPressed(true);
    onClick();
  };
  
  // 4. Render
  return (
    <button onClick={handleClick} className={variant}>
      {label}
    </button>
  );
}
```

## V. TypeScript Best Practices

### Tipado de Props
```typescript
// ✅ GOOD: Explicit interface
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
}

// ❌ BAD: Inline types dificultan reutilización
function UserCard({ user, onEdit }: { user: any; onEdit: Function }) {}
```

### Funciones con retorno explícito
```typescript
// ✅ GOOD: Return type en APIs públicas
export async function fetchUser(id: string): Promise<User | null> {
  // ...
}

// ✅ OK: Inferido en funciones internas simples
function add(a: number, b: number) {
  return a + b; // inferido como number
}
```

### Enums vs Union Types
```typescript
// ✅ GOOD: Union types para valores literales
type Status = 'pending' | 'completed' | 'failed';

// ✅ GOOD: Enums cuando necesitas mapeos
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT'
}
```

## VI. Error Handling

### Async/Await
```typescript
// ✅ GOOD: Try-catch con logging
async function saveUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    console.error('Failed to save user:', error);
    throw new Error('Database write failed');
  }
}
```

### React Error Boundaries
- Usar Error Boundaries para componentes críticos
- Implementar fallback UI amigable
- Loggear errores a servicio de monitoreo (ej: Sentry)

## VII. Testing Standards

### Cobertura Mínima
- **Lógica de negocio (packages/core):** 80%+
- **API Routes:** 70%+
- **Componentes UI:** 60%+ (priorizando lógica sobre rendering)

### Nomenclatura de Tests
```typescript
describe('UserService', () => {
  describe('fetchUser', () => {
    it('should return user when ID exists', async () => {
      // ...
    });
    
    it('should return null when ID does not exist', async () => {
      // ...
    });
    
    it('should throw error when database is unavailable', async () => {
      // ...
    });
  });
});
```

## VIII. Git Commit Messages

### Formato Convencional
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formateo, espacios (no cambios de código)
- `refactor`: Refactor sin cambio de funcionalidad
- `test`: Añadir o corregir tests
- `chore`: Mantenimiento (deps, configs)

### Ejemplos
```bash
feat(auth): add Google OAuth integration

Implement sign-in with Google using Firebase Auth.
Includes redirect flow and session management.

Closes #42

---

fix(api): handle missing client ID in rentas endpoint

Previously threw 500 error, now returns 400 with message.

Refs: SPEC-SEGURIDAD §3.2
```

## IX. Seguridad

### Variables de Entorno
- ❌ NUNCA hardcodear credenciales
- ✅ Usar `.env.local` para secretos (nunca `.env`)
- ✅ Prefijo `NEXT_PUBLIC_` solo para variables expuestas al cliente
- ✅ Validar env vars al inicio (ej: en `lib/config.ts`)

### Sanitización de Inputs
- Validar TODOS los inputs de usuario con zod o similar
- Escapar HTML en campos de texto libre
- Usar Firestore Security Rules como última línea de defensa

## X. Performance

### React Optimization
- Usar `memo()` para componentes pesados que no cambian frecuentemente
- `useCallback` y `useMemo` solo cuando el profiler lo justifique
- Lazy loading de componentes grandes con `React.lazy()`

### Firestore Queries
- Limitar resultados con `.limit()`
- Usar índices compuestos para queries complejas
- Implementar paginación en listas largas

## XI. Accesibilidad

### HTML Semántico
- Usar tags semánticas: `<nav>`, `<main>`, `<article>`, `<section>`
- `<button>` para acciones, `<a>` para navegación
- Roles ARIA solo cuando HTML semántico no es suficiente

### Labels y Alt Text
- Todos los `<input>` con `<label>` asociado
- Imágenes con `alt` descriptivo (o vacío si decorativas)
- Mensajes de error asociados con `aria-describedby`

---

**Versión:** 1.0  
**Fecha:** 2025-11-08  
**Autor:** CODEX (Sistema Integra Evolucionada)  
**Revisores:** SOFIA, GEMINI

## Changelog

### v1.0 (2025-11-08)
- Versión inicial de SPEC-CODIGO
- Convenciones de nombres, comentarios, estructura de archivos
- Standards de TypeScript, testing, commits, seguridad y performance
