import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = ({ children, title = 'SOC Dashboard', onRefresh }) => {
  return (
    <div className="flex h-screen bg-[#0B1220] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title={title} onRefresh={onRefresh} />
        <main className="flex-1 p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
};
