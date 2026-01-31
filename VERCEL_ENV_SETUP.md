# Verificación de Variables de Entorno para Vercel

## Variables Requeridas

### 🔥 Firebase Admin (Server-side)
```bash
FIREBASE_PROJECT_ID=frank-chat-elecsa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@frank-chat-elecsa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_LLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
```

**Cómo obtenerlas:**
1. Ve a Firebase Console → Project Settings (⚙️)
2. Service Accounts → Generate New Private Key
3. Descarga el JSON y extrae los valores

---

### 🔥 Firebase Client (Frontend)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=frank-chat-elecsa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=frank-chat-elecsa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=frank-chat-elecsa.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Cómo obtenerlas:**
1. Firebase Console → Project Settings (⚙️)
2. General → Your apps → Web app
3. Copia la configuración

---

### 📱 Twilio (WhatsApp)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

**Cómo obtenerlas:**
1. Ve a https://console.twilio.com
2. Account Info (lado derecho) → Account SID y Auth Token
3. El número de WhatsApp está en Messaging → Try it out → Send a WhatsApp message

**IMPORTANTE:** También debes configurar el Webhook en Twilio:
- URL: `https://TU-DOMINIO-VERCEL.vercel.app/api/twilio/webhook`
- Método: POST

---

### 🤖 OpenAI
```bash
OPENAI_API_KEY=sk-proj-...
```

**Cómo obtenerla:**
1. Ve a https://platform.openai.com/api-keys
2. Create new secret key

---

## Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable (Name y Value)
4. Asegúrate de marcar: Production, Preview, Development
5. **Redeploy** después de agregar variables nuevas

---

## Verificar Webhook de Twilio

1. Ve a Twilio Console → Messaging → Settings → WhatsApp sandbox settings
2. En "WHEN A MESSAGE COMES IN" debe estar:
   - URL: `https://tu-app.vercel.app/api/twilio/webhook`
   - HTTP: POST
3. Guarda los cambios

---

## Test Rápido

Después de configurar todo, envía un mensaje de WhatsApp al número de Twilio.
Deberías ver la respuesta de Sofía en menos de 5 segundos.

Si no responde, revisa los logs en:
- Vercel → Deployments → [último deploy] → Functions
- Busca errores en `/api/twilio/webhook`
