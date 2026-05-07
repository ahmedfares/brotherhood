import React, { useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

import DashboardIcon from '@material-ui/icons/BarChart';
import NotesIcon from '@material-ui/icons/Notes';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import logo from '../../assets/brand-logo.png';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const history = useHistory();

  const handleNavClick = (path) => {
    history.push(path);
    closeSidebar();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { name: 'Transactions', path: '/payments', icon: <NotesIcon /> },
    { name: 'Account', path: '/account', icon: <AccountBoxIcon /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark">
            <img src={logo} alt="" />
          </span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
          >
            {item.icon}
            {item.name}
          </button>
        ))}
        <div style={{ flex: 1 }}></div>
        <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
          <ExitToAppIcon />
          Logout
        </button>
      </nav>
    </aside>
  );
};


export default Sidebar;
