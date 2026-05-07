import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

import MenuIcon from '@material-ui/icons/Menu';

const Header = ({ toggleSidebar }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/payments':
        return 'Transactions';
      case '/account':
        return 'Account Settings';
      default:
        return 'Brotherhood';
    }
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <MenuIcon />
        </button>
        <div className="header-title">{getPageTitle()}</div>
      </div>
      
      {user && (
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user.firstName} {user.lastName}</span>
            <span className="user-role">@{user.username}</span>
          </div>
          <img 
            src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0e5968&color=f9fbf9`} 
            alt="Profile" 
            className="avatar" 
          />
        </div>
      )}
    </header>
  );
};

export default Header;
