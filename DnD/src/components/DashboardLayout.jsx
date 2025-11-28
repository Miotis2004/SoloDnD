import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dnd-dark to-black text-slate-300 p-4 md:p-6 lg:p-8">
      <header className="mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Campaign: The Lost Mines</h1>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
