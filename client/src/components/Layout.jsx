import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', roles: null },
  { to: '/products', label: 'Products', roles: null },
  { to: '/inventory', label: 'Stock Movements', roles: null },
  { to: '/categories', label: 'Categories', roles: null },
  { to: '/suppliers', label: 'Suppliers', roles: null },
  { to: '/purchase-orders', label: 'Purchase Orders', roles: ['superadmin', 'storekeeper'] },
  { to: '/sales-orders', label: 'Sales Orders', roles: null }
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-5 text-lg font-semibold border-b border-slate-800">
          Inventory MS
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems
            .filter((item) => !item.roles || hasRole(...item.roles))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 text-sm">
          <div className="font-medium">{user?.name}</div>
          <div className="text-slate-400 text-xs mb-2">{user?.role}</div>
          <button onClick={logout} className="text-slate-300 hover:text-white text-sm">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
