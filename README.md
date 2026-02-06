# NexusERP

AI-Native Enterprise Resource Planning System built with React, TypeScript, and SQLite.

![NexusERP](https://img.shields.io/badge/NexusERP-AI--Native-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### General Ledger
- Chart of Accounts management
- Journal Entries with full audit trail
- Trial Balance reporting
- Fiscal period management

### Accounts Payable
- Vendor management
- Invoice processing
- Payment tracking
- Aging reports (Current, 30, 60, 90+ days)

### Accounts Receivable
- Customer management
- Invoice generation
- Payment receipts
- Aging reports

### Procure to Pay (P2P)
- Purchase Requisitions with approval workflow
- Purchase Orders
- Goods Receipts with 3-way matching
- Full requisition-to-payment tracking

### Banking & Reconciliation
- Bank account management linked to GL
- Transaction tracking (deposits, withdrawals, checks, transfers, fees)
- **QuickBooks-style bank reconciliation**
  - Statement date and balance entry
  - Two-column layout (deposits vs payments)
  - Click-to-clear transactions
  - Real-time running balance calculation
  - Complete when difference = $0
  - Reconciliation history and audit trail

### AI Assistant
- Natural language queries about your data
- Intelligent insights and recommendations
- Context-aware help

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Backend**: Express.js, TypeScript
- **Database**: SQLite (better-sqlite3) with WAL mode
- **Build**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/rocanbilly/nexus-erp.git
cd nexus-erp

# Install dependencies
npm install

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5900
- API: http://localhost:3900

### Scripts

```bash
npm run dev        # Start both client and server in dev mode
npm run dev:client # Start only the Vite dev server
npm run dev:server # Start only the Express API server
npm run build      # Build for production
npm run seed       # Seed the database with sample data
```

## Project Structure

```
nexus-erp/
├── server/
│   ├── db.ts           # Database schema and initialization
│   ├── index.ts        # Express server entry point
│   ├── seed.ts         # Sample data seeding
│   └── routes/
│       ├── ap.ts       # Accounts Payable API
│       ├── ar.ts       # Accounts Receivable API
│       ├── banking.ts  # Banking & Reconciliation API
│       ├── chat.ts     # AI Assistant API
│       ├── dashboard.ts
│       ├── gl.ts       # General Ledger API
│       └── p2p.ts      # Procure to Pay API
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
├── data/               # SQLite database (gitignored)
└── public/             # Static assets
```

## API Endpoints

### General Ledger
- `GET /api/gl/accounts` - List chart of accounts
- `GET /api/gl/journal-entries` - List journal entries
- `POST /api/gl/journal-entries` - Create journal entry
- `GET /api/gl/trial-balance` - Get trial balance

### Accounts Payable
- `GET /api/ap/vendors` - List vendors
- `GET /api/ap/invoices` - List AP invoices
- `GET /api/ap/aging` - Get AP aging report

### Accounts Receivable
- `GET /api/ar/customers` - List customers
- `GET /api/ar/invoices` - List AR invoices
- `GET /api/ar/aging` - Get AR aging report

### Procure to Pay
- `GET /api/p2p/requisitions` - List requisitions
- `GET /api/p2p/purchase-orders` - List POs
- `GET /api/p2p/receipts` - List goods receipts

### Banking
- `GET /api/banking/accounts` - List bank accounts
- `GET /api/banking/accounts/:id/transactions` - List transactions
- `GET /api/banking/accounts/:id/uncleared` - Get uncleared transactions
- `POST /api/banking/reconciliations` - Start reconciliation
- `PUT /api/banking/reconciliations/:id/toggle-cleared` - Toggle transaction
- `PUT /api/banking/reconciliations/:id/complete` - Finish reconciliation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database powered by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
