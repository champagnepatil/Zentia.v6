<<<<<<< HEAD
# 🧠 ReflectMe - Clinical Assessment Platform

**Piattaforma digitale per assessment clinici standardizzati e monitoraggio sintomi in tempo reale**

## 🌟 **Phase 2 - Production Ready**

ReflectMe Phase 2 è **completamente implementato** e pronto per il deployment in produzione con tutte le funzionalità avanzate:

### ✅ **Features Implementate**

#### 📊 **Sistema Assessment Completo**
- **4 strumenti validati**: PHQ-9, GAD-7, WHODAS-2.0, DSM-5-CC
- **Scheduling automatico**: biweekly, monthly, once
- **Scoring clinico** con interpretazione automatica
- **Database integration** completa con Supabase

#### 📧 **Email Automation System**
- **Resend API** integrato per invio professionale
- **Template HTML** per reminder e crisi alert
- **Magic links** per accesso sicuro agli assessment
- **Numeri di emergenza** italiani per crisi suicidarie

#### 📄 **PDF Reports Generation**
- **@react-pdf/renderer** per report professionali
- **Clinical layouts** con trend e analisi sintomi
- **Supabase Storage** integrato per archiviazione sicura
- **Download automatico** da UI con un click

#### ⚡ **Real-time Features**
- **Live updates** dei grafici con Supabase Realtime
- **Instant notifications** per completamenti assessment
- **Progressive enhancement** per UX ottimale

#### 🔒 **Security & Privacy**
- **Row Level Security** per isolamento dati
- **HIPAA-compliant** storage e transmission
- **Magic link authentication** per assessment esterni
- **Audit trails** completi per compliance

---

## 🚀 **Stack Tecnologico**

### **Frontend**
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "Tailwind CSS + Headless UI", 
  "state": "React Query + Zustand",
  "charts": "Recharts",
  "pdf": "@react-pdf/renderer",
  "build": "Vite"
}
```

### **Backend & Infrastructure**
```json
{
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth + Magic Links",
  "storage": "Supabase Storage",
  "email": "Resend API",
  "hosting": "Netlify",
  "functions": "Netlify Functions",
  "cron": "Netlify Scheduled Functions"
}
```

---

## 📦 **Installazione & Setup**

### **1. Clona e Installa**
```bash
git clone https://github.com/your-username/reflectme.git
cd reflectme
npm install
```

### **2. Dependencies**
```bash
# Core production dependencies
npm install @supabase/supabase-js
npm install resend
npm install @react-pdf/renderer
npm install recharts

# Development dependencies  
npm install -D @netlify/functions
npm install -D @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer
```

### **3. Environment Setup**
```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
CRON_SECRET=your-secure-secret
NEXT_PUBLIC_BASE_URL=https://your-app.netlify.app
```

### **4. Database Setup**
Il database è già configurato tramite Supabase. Vedere `PHASE2_SETUP.md` per i dettagli dello schema.

### **5. Development**
```bash
npm run dev
```

---

## 🌐 **Deployment su Netlify**

### **Deployment Automatico**

#### **1. Preparazione Files**
```bash
# Build dell'applicazione
npm run build

# Verifica che i file di configurazione esistano
ls netlify.toml        # ✅ Configurazione Netlify
ls public/_redirects   # ✅ SPA routing
ls dist/               # ✅ Build artifacts
```

#### **2. Deploy Diretto (Opzione A)**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy direttamente dalla cartella
netlify deploy --prod --dir=dist
```

#### **3. Deploy via Git (Opzione B)**
1. **Push to GitHub**: Carica il codice su GitHub
2. **Netlify Dashboard**: Vai su [netlify.com](https://netlify.com)
3. **New Site**: Click "New site from Git"
4. **Connect GitHub**: Autorizza e seleziona il repository
5. **Deploy Settings**: Netlify rileva automaticamente `netlify.toml`

#### **4. Environment Variables**
Nel dashboard Netlify, vai a **Site Settings > Environment Variables** e aggiungi:

```env
# Richiesto per AI features
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Opzionale - per database production
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### **5. Build Settings**
Netlify configurazione automatica da `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### **6. Domain Setup**
- **Free Subdomain**: `https://app-name.netlify.app`
- **Custom Domain**: Configura in Site Settings > Domain management
- **SSL**: Automatico con Let's Encrypt

#### **7. Deploy Status**
✅ **Build Time**: ~45 secondi  
✅ **Bundle Size**: ~3.1MB (gzipped: 954KB)  
✅ **SPA Routing**: Configurato  
✅ **Asset Caching**: Ottimizzato  

### **🎯 App Demo Live**
Una volta deployato, l'app sarà accessibile con:
- **Client Dashboard**: `/client` (demo user)
- **Therapist Portal**: `/therapist` (demo therapist)
- **AI Journal**: `/client/journal` (clustering intelligente)
- **Insights**: `/client/insights` (analytics AI)
- **Google Fit**: Dashboard integration CTA

---

## 📊 **Struttura Database**

### **Tabelle Principali**
- `assessments` - Schedulazione assessment
- `assessment_results` - Risultati e punteggi  
- `assessment_reminders` - Tracking invii email
- `notifications` - Sistema notifiche in-app
- `storage/reports` - PDF reports archiviati

### **Security**
Tutte le tabelle hanno **Row Level Security** abilitato con policy specifiche per ruoli therapist/client.

---

## 🔧 **API Endpoints**

### **Assessment Management**
```typescript
GET    /api/assessments?clientId={id}
POST   /api/assessments
PUT    /api/assessments/{id}
DELETE /api/assessments/{id}
```

### **PDF Reports**
```typescript
GET  /api/reports/download?clientId={id}&month={month}
POST /api/test/generate-pdf  # Testing endpoint
```

### **Email System**
```typescript
POST /api/test/send-email  # Testing endpoint
POST /.netlify/functions/assessment-reminders  # Scheduled
```

---

## 🧪 **Testing**

### **PDF Generation**
```bash
# Test PDF generation locally
curl -X POST http://localhost:3000/api/test/generate-pdf \
     -H "Content-Type: application/json" \
     -d '{"clientId":"00000000-0000-4000-a000-000000000002","month":"2024-01"}'
```

### **Email System**
```bash
# Test email sending
curl -X POST http://localhost:3000/api/test/send-email \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","type":"reminder"}'
```

### **Scheduled Functions**
```bash
# Test Netlify function locally
netlify dev
# Then visit: http://localhost:8888/.netlify/functions/assessment-reminders
```

---

## 📋 **Production Checklist**

### ✅ **Completato**
- [x] Database schema e RLS policies
- [x] Email system con Resend
- [x] PDF generation con @react-pdf/renderer  
- [x] Real-time updates
- [x] Security headers e CORS
- [x] Netlify configuration
- [x] Environment variables setup

### 🔄 **Da Configurare nel Deploy**
- [ ] Domain personalizzato su Netlify
- [ ] SSL/TLS certificates (automatico su Netlify)
- [ ] Monitoring e analytics setup
- [ ] Backup strategy per database

---

## 🎯 **Roadmap Future**

### **Phase 3 - Advanced Analytics**
- 📈 **ML Insights** - Prediction models per risk assessment
- 🤖 **AI Summaries** - LLM per riassunti narrativi clinici
- 📱 **Mobile App** - React Native companion app
- 🔗 **API Integrations** - Google Fit, Apple Health

### **Phase 4 - Clinical Network**
- 👥 **Multi-tenant** - Support for clinical practices
- 🏥 **Hospital Integration** - EMR/EHR connectors
- 📊 **Population Analytics** - Aggregate insights
- 🌍 **Internationalization** - Multi-language support

---

## 🤝 **Contributing**

### **Development Workflow**
1. Fork del repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### **Code Standards**
- **TypeScript** strict mode
- **ESLint** + **Prettier** for formatting
- **Conventional Commits** per commit messages
- **Component-driven** development

---

## 📄 **License**

Questo progetto è sotto licenza **MIT** - vedere il file [LICENSE](LICENSE) per i dettagli.

---

## 🙏 **Acknowledgments**

- **Supabase** per il backend-as-a-service eccellente
- **Resend** per l'email delivery affidabile  
- **Netlify** per hosting e serverless functions
- **React PDF** per la generazione di report professionali
- **Tailwind CSS** per il design system moderno

---

## 📞 **Support**

Per domande tecniche o supporto:
- 📧 **Email**: support@reflectme.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/reflectme/issues)
- 📖 **Docs**: Vedere `PHASE2_SETUP.md` per documentazione dettagliata

**ReflectMe Phase 2 è production-ready! 🎉**
=======
# Zentia.v6
UI Changes and updated AI functionality
>>>>>>> ac99743aba5b0956fd0a823149a25d9de92a1087
