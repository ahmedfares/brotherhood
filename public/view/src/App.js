import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { applyTheme, getStoredTheme } from './utils/theme';

import login from './pages/login';
import signup from './pages/signup';
import home from './pages/home';

// We will replace home.js logic entirely, but for now we'll route components directly
import Dashboard from './components/dashboard';
import Todo from './components/todo';
import Account from './components/account';

import Layout from './components/Layout/Layout';

// PrivateRoute component to protect routes
const PrivateRoute = ({ component: Component, ...rest }) => {
  const { loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        localStorage.getItem('AuthToken') ? (
          <Layout>
            <Component {...props} />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

function App() {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route exact path="/login" component={login} />
          <Route exact path="/signup" component={signup} />
          <PrivateRoute exact path="/" component={Dashboard} />
          <PrivateRoute exact path="/payments" component={Todo} />
          <PrivateRoute exact path="/account" component={Account} />
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;
