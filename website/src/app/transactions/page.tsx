'use client'

import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { ReactElement } from "react"

export default function Transactions() {
  return <div className="flex min-h-screen flex-col items-center justify-between p-24">This is the transactions page</div>
}

Transactions.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardLayout contentClassName="flex items-center justify-center">
      {page}
    </DashboardLayout>
  )
}